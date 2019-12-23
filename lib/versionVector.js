import SortedArray from './sortedArray';
import Version from './version';

/**
 * vector/ list of versions of sites in the distributed system
 * keeps tracks of the latest operation received from each site (i.e. version)
 * 
 * Prevents duplicate operations from being applied to CRDT
 */
class VersionVector {
    /**
     * Initialize empty vector to be sorted by siteId
     * Initialize Version/ Clock for local site and insert into
     *  SortedArray vector objec
     */
    constructor(siteId) {
        this.versions = [];
        this.localVersion = new Version(siteId);
        this.versions.push(this.localVersion);
    }

    increment() {
        this.localVersion.counter++;
    }

    /**
     * Updates vector with new version receivved from another site
     * If vector does not contain version, its created and added to vector
     * create exceptions if necessary
     */
    update(incomingVersion) {
        const existingVersion = this.versions.find(version => incomingVersion.siteId === version.siteId);

        if (!existingVersion) {
            const newVersion = new Version(incomingVersion.siteId);

            newVersion.update(incomingVersion);
            this.versions.push(newVersion);
        } else {
            existingVersion.update(incomingVersion);
        }
    }

    /**
     * Check is incoming remote operation has been applied to CRDT
     */
    hasBeenApplied(incomingVersion) {
        const localIncomingVersion = this.getVersionFromVector(incomingVersion);
        const isIncomingInVersionVector = !!localIncomingVersion;

        if (!isIncomingInVersionVector) return false;

        const isIncomingLower = incomingVersion.counter <= localIncomingVersion.counter;
        const isInExceptions = localIncomingVersion.exceptions.includes(incomingVersion.counter);

        return isIncomingLower && !isInExceptions;
    }

    getVersionFromVector(incomingVersion) {
        return this.versions.find(version => version.siteId === incomingVersion.siteId);
    }

    getLocalVersion() {
        return {
            siteId: this.localVersion.siteId,
            counter: this.localVersion.counter
        };
    }
}

export default VersionVector;