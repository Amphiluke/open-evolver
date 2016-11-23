"use strict";

let structure = null,
    tightBondCount = 0;

let atomicMasses = {};

let xhr = new XMLHttpRequest();
xhr.open("GET", "../lib.json", true);
xhr.addEventListener("load", () => {
    if (xhr.status === 200) {
        let lib = JSON.parse(xhr.responseText);
        atomicMasses = lib.atomicMasses;
        self.postMessage({method: "ready"});
    }
});
xhr.send(null);


let api = {
    setStructure(data) {
        let j = 0;
        // Move all existing extra-bonds to the end of a bond array.
        // This allows to speed up iterations through bonds of extra-graph
        for (let i = 0, bonds = data.bonds, bondCount = bonds.length; i < bondCount; i++) {
            if (bonds[j].type === "x") {
                bonds.push(bonds.splice(j, 1)[0]);
            } else {
                j++;
            }
        }
        for (let [pair, params] of data.potentials) {
            params.b = core.stiffness(params.w0, params.D0, core.reducedMass(pair));
        }
        tightBondCount = j;
        structure = data;
        return structure;
    },

    updateStructure() {
        self.postMessage({method: "updateStructure", data: structure});
    },

    totalEnergy() {
        return core.totalEnergy();
    },

    gradient() {
        grad.alloc();
        core.gradient();
        grad.dispose();
        return core.norm;
    },

    evolve(data) {
        core.evolveParams = data;
        core.evolve();
        this.updateStructure();
        return {energy: core.totalEnergy(), norm: core.norm};
    },

    reconnectPairs({pair, cutoff}) {
        let [el1, el2] = pair.match(/[A-Z][^A-Z]*/g),
            cutoff2 = cutoff * cutoff,
            {atoms, bonds} = structure;
        for (let i = 0, aLen = atoms.length; i < aLen; i++) {
            let jEl;
            if (atoms[i].el === el1) {
                jEl = el2;
            } else if (atoms[i].el === el2) {
                jEl = el1;
            } else {
                continue;
            }
            for (let j = i + 1; j < aLen; j++) {
                if (atoms[j].el === jEl) {
                    let k, bond, bLen;
                    for (k = tightBondCount, bond = bonds[k], bLen = bonds.length; k < bLen; bond = bonds[++k]) {
                        if ((bond.iAtm === i && bond.jAtm === j) || (bond.iAtm === j && bond.jAtm === i)) {
                            break;
                        }
                    }
                    if (core.sqrDistance(i, j) > cutoff2) {
                        if (bond) {
                            bonds.splice(k, 1); // break x-bond, as the distance is greater than cutoff
                        }
                    } else if (!bond) {
                        bonds.push({iAtm: i, jAtm: j, type: "x"}); // create x-bond, as one doesn't exist yet
                    }
                }
            }
        }
        this.updateStructure();
    },

    collectStats() {
        let {atoms, bonds} = structure,
            data = {};

        data.name = structure.name;
        data.atomCount = atoms.length;
        data.atoms = new Map();
        for (let {el} of atoms) {
            let count = data.atoms.get(el);
            data.atoms.set(el, count ? count + 1 : 1);
        }

        data.bondCount = bonds.length;
        data.bonds = new Map();
        for (let {type, iAtm, jAtm, potential} of bonds) {
            let prefix = (type === "x") ? "x-" : "";
            let pair = prefix + atoms[jAtm].el + atoms[iAtm].el;
            if (!data.bonds.has(pair)) {
                pair = prefix + atoms[iAtm].el + atoms[jAtm].el;
                if (!data.bonds.has(pair)) {
                    data.bonds.set(pair, {count: 0, avgLen: 0, avgEnergy: 0, totEnergy: 0});
                }
            }
            let distance = core.distance(iAtm, jAtm);
            let bondData = data.bonds.get(pair);
            bondData.count++;
            bondData.avgLen += distance;
            bondData.totEnergy += core.morse(potential, distance);
        }
        for (let [, bondData] of data.bonds) {
            bondData.avgLen /= bondData.count;
            bondData.avgEnergy = bondData.totEnergy / bondData.count;
        }

        data.potentials = structure.potentials;
        data.totalEnergy = core.totalEnergy();
        return data;
    }
};

self.onmessage = function ({data: {method, data} = {}}) {
    if (typeof api[method] === "function") {
        self.postMessage({
            method,
            data: api[method](data)
        });
    }
};


let grad = {
    alloc() {
        let atomCount = structure.atoms.length;
        this.x = new Float32Array(atomCount);
        this.y = new Float32Array(atomCount);
        this.z = new Float32Array(atomCount);
    },

    dispose() {
        this.x = this.y = this.z = null;
    }
};
let rndGrad = Object.assign({}, grad);


let log = {
    alloc(size) {
        this.data = {
            E: new Float32Array(size),
            grad: new Float32Array(size),
            dt: new Float32Array(size)
        };
    },

    dispose() {
        this.data = null;
    },

    write(index) {
        let data = this.data;
        data.E[index] = core.totalEnergy();
        data.grad[index] = core.norm;
        data.dt[index] = core.timeStep();
    }
};


let core = {
    /**
     * Calculate reduced mass for a given pair of atoms
     * @param {String} pair A pair of element labels, e.g. "ZnO".
     * Extra-graph pairs ("x-" prefixed) are also acceptable.
     * @returns {Number}
     */
    reducedMass(pair) {
        let elements = pair.match(/[A-Z][^A-Z]*/g);
        if (!elements || elements.length < 2) {
            throw new Error(`Cannot extract element labels from string ${pair}`);
        }
        const mass1 = atomicMasses[elements[0]];
        const mass2 = atomicMasses[elements[1]];
        return mass1 * mass2 / (mass1 + mass2);
    },
    
    stiffness(w0, D0, m) {
        // b{1/Å} = w0{1/cm} * 2*pi*c{cm/s} * sqrt[µ{a.m.u.}*1.6605655E-27 / (2*D0{eV}*1.6021892E-19)] / 1E+10
        // i.e.
        // b{1/Å} = w0{1/cm} * sqrt[µ{a.m.u.} / D0{eV}] * 1.3559906E-3
        return w0 * Math.sqrt(m / D0) * 1.3559906E-3;
    },

    // In intensive calculations use this method for comparisons rather than `core.distance`
    sqrDistance(atom1, atom2) {
        let at1 = structure.atoms[atom1],
            at2 = structure.atoms[atom2],
            dx = at1.x - at2.x,
            dy = at1.y - at2.y,
            dz = at1.z - at2.z;
        return dx * dx + dy * dy + dz * dz;
    },

    distance(atom1, atom2) {
        return Math.sqrt(this.sqrDistance(atom1, atom2));
    },

    morse({D0, R0, b}, distance) {
        let exponent = Math.exp(b * (R0 - distance));
        return D0 * exponent * (exponent - 2);
    },

    derivative({D0, R0, b}, distance) {
        let cA = D0 * Math.exp(2 * b * R0),
            cB = -2 * b,
            cC = -2 * Math.sqrt(D0 * cA),
            cD = Math.exp(-b * distance);
        return cB * cD * (cA * cD + 0.5 * cC);
    },

    gradComponent(atom1, atom2, bond) {
        let distance = this.distance(atom1, atom2),
            factor = this.derivative(structure.bonds[bond].potential, distance) / distance,
            at1 = structure.atoms[atom1],
            at2 = structure.atoms[atom2];
        return {
            x: factor * (at1.x - at2.x),
            y: factor * (at1.y - at2.y),
            z: factor * (at1.z - at2.z)
        };
    },

    totalEnergy() {
        let energy = 0;
        for (let {potential, iAtm, jAtm} of structure.bonds) {
            energy += this.morse(potential, this.distance(iAtm, jAtm));
        }
        return energy;
    },

    gradient() {
        let {atoms, bonds} = structure,
            atomCount = atoms.length,
            bondCount = bonds.length;

        this.norm = this.sumSqr = this.rootSumSqr = 0;

        for (let i = 0; i < atomCount; i++) {
            grad.x[i] = grad.y[i] = grad.z[i] = 0;
            for (let b = 0; b < bondCount; b++) {
                let j;
                if (bonds[b].iAtm === i) {
                    j = bonds[b].jAtm;
                } else if (bonds[b].jAtm === i) {
                    j = bonds[b].iAtm;
                } else {
                    continue;
                }
                let gradComponent = this.gradComponent(i, j, b);
                grad.x[i] += gradComponent.x;
                grad.y[i] += gradComponent.y;
                grad.z[i] += gradComponent.z;
            }

            let sqrForce = grad.x[i] * grad.x[i] + grad.y[i] * grad.y[i] + grad.z[i] * grad.z[i];
            let mass = atomicMasses[atoms[i].el];
            this.sumSqr += sqrForce / mass;
            this.rootSumSqr += sqrForce / (mass * mass);
            this.norm += sqrForce;
        }

        this.rootSumSqr = Math.sqrt(this.rootSumSqr);
        this.norm = Math.sqrt(this.norm);

        // Calc unit vector of internal gradient
        let invNorm = 1 / this.norm;
        for (let i = 0; i < atomCount; i++) {
            grad.x[i] *= invNorm;
            grad.y[i] *= invNorm;
            grad.z[i] *= invNorm;
        }

        return this.norm;
    },

    stochGradient() {
        let {atoms, bonds} = structure,
            atomCount = atoms.length,
            bondCount = bonds.length;

        let rndNorm = this.norm = this.sumSqr = this.rootSumSqr = 0;

        for (let i = 0; i < atomCount; i++) {
            grad.x[i] = grad.y[i] = grad.z[i] = 0;
            for (let b = 0; b < bondCount; b++) {
                let j;
                if (bonds[b].iAtm === i) {
                    j = bonds[b].jAtm;
                } else if (bonds[b].jAtm === i) {
                    j = bonds[b].iAtm;
                } else {
                    continue;
                }
                let gradComponent = this.gradComponent(i, j, b);
                grad.x[i] += gradComponent.x;
                grad.y[i] += gradComponent.y;
                grad.z[i] += gradComponent.z;
            }

            let sqrForce = grad.x[i] * grad.x[i] + grad.y[i] * grad.y[i] + grad.z[i] * grad.z[i];
            let mass = atomicMasses[atoms[i].el];
            this.sumSqr += sqrForce / mass;
            this.rootSumSqr += sqrForce / (mass * mass);
            this.norm += sqrForce;

            rndGrad.x[i] = 50 - Math.random() * 100;
            rndGrad.y[i] = 50 - Math.random() * 100;
            rndGrad.z[i] = 50 - Math.random() * 100;
            rndNorm += rndGrad.x[i] * rndGrad.x[i] + rndGrad.y[i] * rndGrad.y[i] + rndGrad.z[i] * rndGrad.z[i];
        }

        this.rootSumSqr = Math.sqrt(this.rootSumSqr);
        this.norm = Math.sqrt(this.norm);
        rndNorm = Math.sqrt(rndNorm);
        let rsltNorm = 0;

        // Calc unit vectors of internal and external gradient as well as resulting gradient
        let invNorm = 1 / this.norm;
        let invRndNorm = 1 / rndNorm;
        for (let i = 0; i < atomCount; i++) {
            grad.x[i] *= invNorm;
            grad.y[i] *= invNorm;
            grad.z[i] *= invNorm;
            rndGrad.x[i] *= invRndNorm;
            rndGrad.y[i] *= invRndNorm;
            rndGrad.z[i] *= invRndNorm;
            grad.x[i] += rndGrad.x[i];
            grad.y[i] += rndGrad.y[i];
            grad.z[i] += rndGrad.z[i];
            rsltNorm += grad.x[i] * grad.x[i] + grad.y[i] * grad.y[i] + grad.z[i] * grad.z[i];
        }

        rsltNorm = Math.sqrt(rsltNorm);

        // Calc unit vector of resulting gradient
        invNorm = 1 / rsltNorm;
        for (let i = 0; i < atomCount; i++) {
            grad.x[i] *= invNorm;
            grad.y[i] *= invNorm;
            grad.z[i] *= invNorm;
        }

        return this.norm;
    },

    timeStep() {
        // dt=sqrt(3NkT/sumSqr); [sumSqr]=eV^2/(angst^2*amu)
        return 1.636886e-16 * Math.sqrt(structure.atoms.length * this.evolveParams.temperature / this.sumSqr);
    },

    tuneEvolver() {
        let params = this.evolveParams,
            initFns = [], // functions to be called before the evolution procedure
            stepFns = [], // functions to be called at every evolution step
            finFns = []; // functions to be called after the evolution procedure is finished
        initFns.push(grad.alloc.bind(grad));
        stepFns.push(params.stoch ? this.stochGradient.bind(this) : this.gradient.bind(this));
        finFns.push(grad.dispose.bind(grad));
        if (params.stoch) {
            initFns.push(rndGrad.alloc.bind(rndGrad));
            finFns.push(rndGrad.dispose.bind(rndGrad));
        }
        let logInterval = params.logInterval;
        if (logInterval) {
            initFns.push(log.alloc.bind(log, Math.floor(params.stepCount / logInterval)));
            stepFns.push(stepNo => {
                let index = stepNo / logInterval;
                if (Number.isInteger(index)) {
                    log.write(index);
                }
            });
            finFns.push(() => {
                self.postMessage({method: "evolve:log", data: log.data});
                log.dispose();
            });
        }
        return {
            initialize() {
                initFns.forEach(fn => fn());
            },
            step(stepNo) {
                stepFns.forEach(fn => fn(stepNo));
            },
            finalize() {
                finFns.forEach(fn => fn());
            }
        };
    },

    evolve() {
        let params = this.evolveParams,
            functor = this.tuneEvolver(),
            atoms = structure.atoms,
            atomCount = atoms.length,
            factor = 1.2926E-4 * atomCount * params.temperature, // 1.5NkT [eV]
            interval = Math.ceil(params.stepCount / 100),
            progressFactor = 100 / params.stepCount,
            progressMsg = {method: "evolve:progress", data: 0};
        functor.initialize();
        functor.step(); // pre-calculate current value of gradient before the 1st step
        for (let stepNo = 0, stepCount = params.stepCount; stepNo < stepCount; stepNo++) {
            let step = factor * this.rootSumSqr / this.sumSqr;
            for (let i = 0; i < atomCount; i++) {
                atoms[i].x -= step * grad.x[i];
                atoms[i].y -= step * grad.y[i];
                atoms[i].z -= step * grad.z[i];
            }
            if (stepNo % interval === 0) {
                progressMsg.data = stepNo * progressFactor;
                self.postMessage(progressMsg);
            }
            functor.step(stepNo);
        }
        functor.finalize();
    }
};