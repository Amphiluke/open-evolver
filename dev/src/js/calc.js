(function (global) {

"use strict";

var api = {},
    core = {},
    structure = null,
    tightBondCount = 0,
    grad = {},
    rndGrad = {},
    log = {};


global.importScripts("utils.js"); // will add `OE.utils` into the global context of the worker

api.setStructure = function (data) {
    var bonds = data.bonds,
        bondCount = bonds.length,
        i, j;
    // Move all existing extra-bonds to the end of a bond array.
    // This allows to speed up iterations through bonds of extra-graph
    for (i = 0, j = 0; i < bondCount; i++) {
        if (bonds[j].type === "x") {
            bonds.push(bonds.splice(j, 1)[0]);
        } else {
            j++;
        }
    }
    tightBondCount = j;
    structure = data;
    return structure;
};

api.updateStructure = function () {
    global.postMessage({method: "updateStructure", data: structure});
};

api.totalEnergy = function () {
    return core.totalEnergy();
};

api.gradient = function () {
    grad.alloc();
    core.gradient();
    grad.dispose();
    return core.norm;
};

api.evolve = function (data) {
    core.evolveParams = data;
    core.evolve();
    api.updateStructure();
    return {energy: core.totalEnergy(), norm: core.norm};
};

api.reconnectPairs = function (data) {
    var elements = data.pair.match(/[A-Z][^A-Z]*/g),
        cutoff2 = data.cutoff * data.cutoff,
        atoms = structure.atoms,
        aLen = atoms.length,
        bonds = structure.bonds,
        bond, bLen,
        i, j, k,
        jEl;
    for (i = 0; i < aLen; i++) {
        if (atoms[i].el === elements[0]) {
            jEl = elements[1];
        } else if (atoms[i].el === elements[1]) {
            jEl = elements[0];
        } else {
            continue;
        }
        for (j = i + 1; j < aLen; j++) {
            if (atoms[j].el === jEl) {
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
                    bonds.push({iAtm: i, jAtm: j, type: "x"}); // create x-bond, as one isn't exist yet
                }
            }
        }
    }
    api.updateStructure();
};

api.collectStats = function () {
    var atoms = structure.atoms,
        bonds = structure.bonds,
        data = {},
        i, len,
        prefix, pair,
        distance;

    data.name = structure.name;
    data.atomCount = len = atoms.length;
    data.atoms = {};
    for (i = 0; i < len; i++) {
        if (data.atoms.hasOwnProperty(atoms[i].el)) {
            data.atoms[atoms[i].el]++;
        } else {
            data.atoms[atoms[i].el] = 1;
        }
    }

    data.bondCount = len = bonds.length;
    data.bonds = {};
    for (i = 0; i < len; i++) {
        prefix = (bonds[i].type === "x") ? "x-" : "";
        pair = prefix + atoms[bonds[i].jAtm].el + atoms[bonds[i].iAtm].el;
        if (!data.bonds.hasOwnProperty(pair)) {
            pair = prefix + atoms[bonds[i].iAtm].el + atoms[bonds[i].jAtm].el;
            if (!data.bonds.hasOwnProperty(pair)) {
                data.bonds[pair] = {count: 0, avgLen: 0, avgEnergy: 0, totEnergy: 0};
            }
        }
        distance = core.distance(bonds[i].iAtm, bonds[i].jAtm);
        data.bonds[pair].count++;
        data.bonds[pair].avgLen += distance;
        data.bonds[pair].totEnergy += core.morse(bonds[i].potential, distance);
    }
    for (pair in data.bonds) {
        if (data.bonds.hasOwnProperty(pair)) {
            data.bonds[pair].avgLen /= data.bonds[pair].count;
            data.bonds[pair].avgEnergy = data.bonds[pair].totEnergy / data.bonds[pair].count;
        }
    }

    data.potentials = structure.potentials;
    data.totalEnergy = core.totalEnergy();
    return data;
};


global.onmessage = function (e) {
    var method = e.data && e.data.method;
    if (typeof api[method] === "function") {
        global.postMessage({
            method: method,
            data: api[method].call(api, e.data.data)
        });
    }
};


grad.alloc = rndGrad.alloc = function () {
    var atomCount = structure.atoms.length;
    this.x = new Float32Array(atomCount);
    this.y = new Float32Array(atomCount);
    this.z = new Float32Array(atomCount);
};
grad.dispose = rndGrad.dispose = function () {
    this.x = this.y = this.z = null;
};


log.alloc = function (size) {
    this.data = {
        E: new Float32Array(size),
        grad: new Float32Array(size),
        dt: new Float32Array(size)
    };
};
log.dispose = function () {
    this.data = null;
};
log.write = function (index) {
    var data = this.data;
    data.E[index] = core.totalEnergy();
    data.grad[index] = core.norm;
    data.dt[index] = core.timeStep();
};


/**
 * In intensive calculations use this method for comparisons rather than `core.distance`
 */
core.sqrDistance = function (atom1, atom2) {
    var at1 = structure.atoms[atom1],
        at2 = structure.atoms[atom2],
        dx = at1.x - at2.x,
        dy = at1.y - at2.y,
        dz = at1.z - at2.z;
    return dx * dx + dy * dy + dz * dz;
};

core.distance = function (atom1, atom2) {
    return Math.sqrt(core.sqrDistance(atom1, atom2));
};

core.morse = function (params, distance) {
    var exponent = Math.exp(params.b * (params.R0 - distance));
    return params.D0 * exponent * (exponent - 2);
};

core.derivative = function (params, distance) {
    var cA = params.D0 * Math.exp(2 * params.b * params.R0),
        cB = -2 * params.b,
        cC = -2 * Math.sqrt(params.D0 * cA),
        cD = Math.exp(-params.b * distance);
    return cB * cD * (cA * cD + 0.5 * cC);
};

core.gradComponent = function (atom1, atom2, bond) {
    var distance = core.distance(atom1, atom2),
        factor = core.derivative(structure.bonds[bond].potential, distance) / distance,
        at1 = structure.atoms[atom1],
        at2 = structure.atoms[atom2];
    return {
        x: factor * (at1.x - at2.x),
        y: factor * (at1.y - at2.y),
        z: factor * (at1.z - at2.z)
    };
};

core.totalEnergy = function () {
    var energy = 0,
        bonds = structure.bonds,
        i, len;
    for (i = 0, len = bonds.length; i < len; i++) {
        energy += core.morse(bonds[i].potential, core.distance(bonds[i].iAtm, bonds[i].jAtm));
    }
    return energy;
};

core.gradient = function () {
    var atoms = structure.atoms,
        atomCount = atoms.length,
        bonds = structure.bonds,
        bondCount = bonds.length,
        utils = global.OE.utils,
        gradComponent,
        sqrForce, invNorm,
        i, j, b,
        mass;

    core.norm = core.sumSqr = core.rootSumSqr = 0;

    for (i = 0; i < atomCount; i++) {
        grad.x[i] = grad.y[i] = grad.z[i] = 0;
        for (b = 0; b < bondCount; b++) {
            if (bonds[b].iAtm === i) {
                j = bonds[b].jAtm;
            } else if (bonds[b].jAtm === i) {
                j = bonds[b].iAtm;
            } else {
                continue;
            }
            gradComponent = core.gradComponent(i, j, b);
            grad.x[i] += gradComponent.x;
            grad.y[i] += gradComponent.y;
            grad.z[i] += gradComponent.z;
        }

        sqrForce = grad.x[i] * grad.x[i] + grad.y[i] * grad.y[i] + grad.z[i] * grad.z[i];
        mass = utils.getAtomicMass(atoms[i].el);
        core.sumSqr += sqrForce / mass;
        core.rootSumSqr += sqrForce / (mass * mass);
        core.norm += sqrForce;
    }

    core.rootSumSqr = Math.sqrt(core.rootSumSqr);
    core.norm = Math.sqrt(core.norm);

    // Calc unit vector of internal gradient
    invNorm = 1 / core.norm;
    for (i = 0; i < atomCount; i++) {
        grad.x[i] *= invNorm;
        grad.y[i] *= invNorm;
        grad.z[i] *= invNorm;
    }

    return core.norm;
};

core.stochGradient = function () {
    var atoms = structure.atoms,
        atomCount = atoms.length,
        bonds = structure.bonds,
        bondCount = bonds.length,
        utils = global.OE.utils,
        gradComponent,
        sqrForce, rndNorm, invNorm, invRndNorm, rsltNorm,
        i, j, b,
        mass;

    rndNorm = core.norm = core.sumSqr = core.rootSumSqr = 0;

    for (i = 0; i < atomCount; i++) {
        grad.x[i] = grad.y[i] = grad.z[i] = 0;
        for (b = 0; b < bondCount; b++) {
            if (bonds[b].iAtm === i) {
                j = bonds[b].jAtm;
            } else if (bonds[b].jAtm === i) {
                j = bonds[b].iAtm;
            } else {
                continue;
            }
            gradComponent = core.gradComponent(i, j, b);
            grad.x[i] += gradComponent.x;
            grad.y[i] += gradComponent.y;
            grad.z[i] += gradComponent.z;
        }

        sqrForce = grad.x[i] * grad.x[i] + grad.y[i] * grad.y[i] + grad.z[i] * grad.z[i];
        mass = utils.getAtomicMass(atoms[i].el);
        core.sumSqr += sqrForce / mass;
        core.rootSumSqr += sqrForce / (mass * mass);
        core.norm += sqrForce;

        rndGrad.x[i] = 50 - Math.random() * 100;
        rndGrad.y[i] = 50 - Math.random() * 100;
        rndGrad.z[i] = 50 - Math.random() * 100;
        rndNorm += rndGrad.x[i] * rndGrad.x[i] + rndGrad.y[i] * rndGrad.y[i] + rndGrad.z[i] * rndGrad.z[i];
    }

    core.rootSumSqr = Math.sqrt(core.rootSumSqr);
    core.norm = Math.sqrt(core.norm);
    rndNorm = Math.sqrt(rndNorm);
    rsltNorm = 0;

    // Calc unit vectors of internal and external gradient as well as resulting gradient
    invNorm = 1 / core.norm;
    invRndNorm = 1 / rndNorm;
    for (i = 0; i < atomCount; i++) {
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
    for (i = 0; i < atomCount; i++) {
        grad.x[i] *= invNorm;
        grad.y[i] *= invNorm;
        grad.z[i] *= invNorm;
    }

    return core.norm;
};

core.timeStep = function () {
    // dt=sqrt(3NkT/sumSqr); [sumSqr]=eV^2/(angst^2*amu)
    return 1.636886e-16 * Math.sqrt(structure.atoms.length * core.evolveParams.temperature / core.sumSqr);
};

core.tuneEvolver = function () {
    var params = core.evolveParams,
        logInterval = params.logInterval,
        functor = {},
        initFns = [], // functions to be called before the evolution procedure
        stepFns = [], // functions to be called at every evolution step
        finFns = []; // functions to be called after the evolution procedure is finished
    initFns.push(grad.alloc.bind(grad));
    stepFns.push(params.stoch ? core.stochGradient.bind(core) : core.gradient.bind(core));
    finFns.push(grad.dispose.bind(grad));
    if (params.stoch) {
        initFns.push(rndGrad.alloc.bind(rndGrad));
        finFns.push(rndGrad.dispose.bind(rndGrad));
    }
    if (logInterval) {
        initFns.push(log.alloc.bind(log, Math.floor(params.stepCount / logInterval)));
        stepFns.push(function (stepNo) {
            if (stepNo % logInterval === 0) {
                log.write(stepNo / logInterval);
            }
        });
        finFns.push(function () {
            global.postMessage({method: "evolve.log", data: log.data});
            log.dispose();
        });
    }
    functor.initialize = function () {
        initFns.forEach(function (fn) {
            fn();
        });
    };
    functor.step = function (stepNo) {
        // Prefer the `for` loop over `stepFns.forEach` for performance reasons
        for (var i = 0, len = stepFns.length; i < len; i++) {
            stepFns[i](stepNo);
        }
    };
    functor.finalize = function () {
        finFns.forEach(function (fn) {
            fn();
        });
    };
    return functor;
};

core.evolve = function () {
    var params = core.evolveParams,
        functor = core.tuneEvolver(),
        atoms = structure.atoms,
        atomCount = atoms.length,
        factor = 1.2926E-4 * atomCount * params.temperature, // 1.5NkT [eV]
        interval = Math.ceil(params.stepCount / 100),
        progressFactor = 100 / params.stepCount,
        progressMsg = {method: "evolve.progress"},
        stepNo, stepCount, step, i;
    functor.initialize();
    functor.step(); // pre-calculate current value of gradient before the 1st step
    for (stepNo = 0, stepCount = params.stepCount; stepNo < stepCount; stepNo++) {
        step = factor * core.rootSumSqr / core.sumSqr;
        for (i = 0; i < atomCount; i++) {
            atoms[i].x -= step * grad.x[i];
            atoms[i].y -= step * grad.y[i];
            atoms[i].z -= step * grad.z[i];
        }
        if (stepNo % interval === 0) {
            progressMsg.data = stepNo * progressFactor;
            global.postMessage(progressMsg);
        }
        functor.step(stepNo);
    }
    functor.finalize();
};

})(this);