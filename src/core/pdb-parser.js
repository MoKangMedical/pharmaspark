// PharmaSpark — PDB File Parser
// Parses PDB/mmCIF files into structured atom/residue/chain data
import { getElement } from "./elements";
export function parsePDB(pdbText) {
    const atoms = [];
    const helixResidues = new Set();
    const sheetResidues = new Set();
    let title = "";
    const lines = pdbText.split("\n");
    for (const line of lines) {
        const recordType = line.substring(0, 6).trim();
        if (recordType === "TITLE") {
            title += line.substring(10).trim();
        }
        // Parse HELIX records
        if (recordType === "HELIX") {
            const chain = line.charAt(19);
            const startSeq = parseInt(line.substring(21, 25).trim());
            const endSeq = parseInt(line.substring(33, 37).trim());
            for (let i = startSeq; i <= endSeq; i++) {
                helixResidues.add(`${chain}_${i}`);
            }
        }
        // Parse SHEET records
        if (recordType === "SHEET") {
            const chain = line.charAt(21);
            const startSeq = parseInt(line.substring(22, 26).trim());
            const endSeq = parseInt(line.substring(33, 37).trim());
            for (let i = startSeq; i <= endSeq; i++) {
                sheetResidues.add(`${chain}_${i}`);
            }
        }
        // Parse ATOM / HETATM
        if (recordType === "ATOM" || recordType === "HETATM") {
            const element = line.length >= 78 ? line.substring(76, 78).trim() : line.substring(12, 14).trim().replace(/[0-9]/g, "");
            const elemProps = getElement(element);
            atoms.push({
                serial: parseInt(line.substring(6, 11).trim()),
                name: line.substring(12, 16).trim(),
                altLoc: line.charAt(16),
                resName: line.substring(17, 20).trim(),
                chainID: line.charAt(21),
                resSeq: parseInt(line.substring(22, 26).trim()),
                iCode: line.charAt(26),
                x: parseFloat(line.substring(30, 38).trim()),
                y: parseFloat(line.substring(38, 46).trim()),
                z: parseFloat(line.substring(46, 54).trim()),
                occupancy: line.length >= 60 ? parseFloat(line.substring(54, 60).trim()) : 1.0,
                tempFactor: line.length >= 66 ? parseFloat(line.substring(60, 66).trim()) : 0.0,
                element,
                charge: line.length >= 80 ? line.substring(78, 80).trim() : "",
                color: elemProps.color,
                vdWRadius: elemProps.vdWRadius,
            });
        }
    }
    // Build chains and residues
    const chainMap = new Map();
    for (const atom of atoms) {
        if (!chainMap.has(atom.chainID)) {
            chainMap.set(atom.chainID, new Map());
        }
        const resMap = chainMap.get(atom.chainID);
        if (!resMap.has(atom.resSeq)) {
            const key = `${atom.chainID}_${atom.resSeq}`;
            let ss = "coil";
            if (helixResidues.has(key))
                ss = "helix";
            else if (sheetResidues.has(key))
                ss = "sheet";
            resMap.set(atom.resSeq, {
                name: atom.resName,
                seq: atom.resSeq,
                chainID: atom.chainID,
                atoms: [],
                secondaryStructure: ss,
            });
        }
        resMap.get(atom.resSeq).atoms.push(atom);
    }
    const chains = [];
    for (const [chainID, resMap] of chainMap) {
        const residues = Array.from(resMap.values()).sort((a, b) => a.seq - b.seq);
        chains.push({ id: chainID, residues });
    }
    // Compute bounding box
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const a of atoms) {
        minX = Math.min(minX, a.x);
        minY = Math.min(minY, a.y);
        minZ = Math.min(minZ, a.z);
        maxX = Math.max(maxX, a.x);
        maxY = Math.max(maxY, a.y);
        maxZ = Math.max(maxZ, a.z);
    }
    return {
        id: title.trim() || "unknown",
        title: title.trim(),
        chains,
        atoms,
        boundingBox: { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
        center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    };
}
//# sourceMappingURL=pdb-parser.js.map