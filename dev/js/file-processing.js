import utils from "./utils.js";
import structure from "./structure.js";

let formats = {};

formats.hin = {
    /* HIN file syntax defines the atom record as follows:
    atom <at#> <atom-name> <element> <type> <flags> <at-charge> <x> <y> <z> <cn> <nbor# nbor-bond>
     0     1        2          3       4       5         6       7   8   9   10         11... */
    parseMolecule(atomRecords, result) {
        let {atoms, bonds} = result,
            inc = atoms.length, // total number of atoms added into the structure previously
            spaceRE = /\s+/;
        for (let i = 0, len = atomRecords.length; i < len; i++) {
            let items = atomRecords[i].trim().split(spaceRE);
            atoms.push({el: items[3], x: +items[7], y: +items[8], z: +items[9]});
            for (let j = 11, cn = 2 * items[10] + 11; j < cn; j += 2) {
                if (items[j] - 1 > i) {
                    bonds.push({
                        iAtm: i + inc,
                        jAtm: items[j] - 1 + inc,
                        type: items[j + 1]
                    });
                }
            }
        }
    },

    parse(fileStr) {
        let molRE = /\n\s*mol\s+(\d+)([\s\S]+)\n\s*endmol\s+\1\b/g,
            atmRE = /^atom\s+\d+\s+.+$/gm,
            result = {atoms: [], bonds: []},
            mol = molRE.exec(fileStr);
        while (mol) {
            this.parseMolecule(mol[2].match(atmRE), result);
            mol = molRE.exec(fileStr);
        }
        return result;
    }
};

formats.ml2 = formats.mol2 = {
    /* MOL2 file syntax defines the atom record as follows:
    atom_id atom_name x y z atom_type [subst_id [subst_name [charge [status_bit]]]]
       0        1     2 3 4     5         6          7         8         9
    MOL2 file syntax defines the bond record as follows:
    bond_id origin_atom_id target_atom_id bond_type [status_bits]
       0          1              2            3           4 */
    parseMolecule(atomRecords, bondRecords, result) {
        let {atoms, bonds} = result,
            inc = atoms.length, // total number of atoms added into the structure previously
            spaceRE = /\s+/;
        for (let rec of atomRecords) {
            let items = rec.trim().split(spaceRE);
            let dotPos = items[5].indexOf("."); // atom_type may look like "C.3"
            atoms.push({
                el: (dotPos > -1) ? items[5].slice(0, dotPos) : items[5],
                x: +items[2],
                y: +items[3],
                z: +items[4]
            });
        }
        for (let rec of bondRecords) {
            let items = rec.trim().split(spaceRE);
            bonds.push({
                iAtm: items[1] - 1 + inc,
                jAtm: items[2] - 1 + inc,
                type: items[3]
            });
        }
    },

    parse(fileStr) {
        let result = {atoms: [], bonds: []},
            molChunks = fileStr.split("@<TRIPOS>MOLECULE").slice(1),
            atomRE = /@<TRIPOS>ATOM([\s\S]+?)(?:@<TRIPOS>|$)/,
            bondRE = /@<TRIPOS>BOND([\s\S]+?)(?:@<TRIPOS>|$)/,
            newLineRE = /(?:\r?\n)+/,
            noRec = [];
        for (let chunk of molChunks) {
            let atomSection = chunk.match(atomRE);
            let atomRecords = (atomSection && atomSection[1].trim().split(newLineRE)) || noRec;
            let bondSection = chunk.match(bondRE);
            let bondRecords = (bondSection && bondSection[1].trim().split(newLineRE)) || noRec;
            this.parseMolecule(atomRecords, bondRecords, result);
        }
        return result;
    }
};

formats.xyz = {
    parseAtomRecord(atomStr) {
        let items = atomStr.trim().split(/\s+/);
        return {
            el: items[0],
            x: +items[1],
            y: +items[2],
            z: +items[3]
        };
    },

    parse(fileStr) {
        let atomRecords = fileStr.split(/(?:\r?\n)+/).slice(2);
        return atomRecords && {
            atoms: atomRecords.map(this.parseAtomRecord, this),
            bonds: []
        };
    }
};


export default {
    load(fileRef) {
        return utils.readFile(fileRef).then(contents => {
            let name = fileRef.name || String(fileRef),
                type = name.slice(name.lastIndexOf(".") + 1).toLowerCase(),
                format = formats[type] || formats.hin,
                newStructure = format.parse(contents);
            newStructure.name = name.replace(/.*[\/\\]/, "") || "unknown";
            structure.overwrite(newStructure);
            return contents;
        });
    },

    makeFile(type, graphType) {
        type = type.toUpperCase();
        if (typeof this[`make${type}`] === "function") {
            return this[`make${type}`](graphType);
        }
        return false;
    },

    makeHIN(graphType) {
        let hin = ";The structure was saved in OpenEvolver\nforcefield mm+\n";
        if (graphType === "empty") {
            let i = 0;
            for (let {el, x, y, z} of structure.structure.atoms) {
                hin += `mol ${++i}
atom 1 - ${el} ** - 0 ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)} 0
endmol ${i}
`;
            }
        } else {
            let nbors = new Array(structure.structure.atoms.length);
            for (let {type, iAtm, jAtm} of structure.structure.bonds) {
                if (graphType !== "basic" || type !== "x") {
                    (nbors[iAtm] || (nbors[iAtm] = [])).push(`${jAtm + 1} ${type}`);
                    (nbors[jAtm] || (nbors[jAtm] = [])).push(`${iAtm + 1} ${type}`);
                }
            }
            hin += "mol 1\n"; // multiple molecule cases are not supported in this version
            let i = -1;
            for (let {el, x, y, z} of structure.structure.atoms) {
                hin += `atom ${++i + 1} - ${el} ** - 0 ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)} ` +
                    (nbors[i] ? `${nbors[i].length} ${nbors[i].join(" ")}` : "0") + "\n";
            }
            hin += "endmol 1";
        }
        return hin;
    },

    makeML2(graphType) {
        let ml2 = `# The structure was saved in OpenEvolver
@<TRIPOS>MOLECULE
****
${structure.structure.atoms.length} %BOND_COUNT%
SMALL
NO_CHARGES


@<TRIPOS>ATOM
`; // bond count is TBD later
        let i = 0;
        for (let {el, x, y, z} of structure.structure.atoms) {
            ml2 += `${++i} ${el} ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)} ${el} 1 **** 0.0000\n`;
        }
        let bondCount = 0;
        if (graphType !== "empty") {
            ml2 += "@<TRIPOS>BOND\n";
            for (let {type, iAtm, jAtm} of structure.structure.bonds) {
                if (graphType !== "basic" || type !== "x") {
                    bondCount++;
                    ml2 += `${bondCount} ${iAtm + 1} ${jAtm + 1} ${type}\n`;
                }
            }
        }
        ml2 += "@<TRIPOS>SUBSTRUCTURE\n1 **** 0";
        ml2 = ml2.replace("%BOND_COUNT%", bondCount.toString());
        return ml2;
    },

    makeXYZ() {
        let xyz = structure.structure.atoms.length + "\nThe structure was saved in OpenEvolver";
        for (let {el, x, y, z} of structure.structure.atoms) {
            xyz += `\n${el} ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`;
        }
        return xyz;
    }
};