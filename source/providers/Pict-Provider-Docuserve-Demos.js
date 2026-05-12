const libPictProvider = require('pict-provider');

/**
 * Highest demo-entry schema version this provider understands.
 *
 * Each demo entry declares `DemoSchemaVersion` (defaults to 1 when
 * omitted).  Entries above this constant are rejected at register()
 * with a console warning — the host library was built against newer
 * docuserve features the running provider doesn't have wired yet.
 * Hosts in this position should either upgrade pict-docuserve or
 * publish a v1-compatible fallback demo alongside the v2 entry.
 *
 * Bump this constant when adding new fields / behaviours to the
 * registry contract (and document the new field in the entry-shape
 * comment block below).  Existing libraries continue to register
 * their v1 entries unchanged.
 *
 * @type {number}
 */
const MAX_DEMO_SCHEMA_VERSION = 1;

/**
 * Pict-Provider-Docuserve-Demos
 *
 * Runtime registry of interactive demos that docuserve renders alongside
 * documentation pages.  Each library that ships demos exports a small
 * registration function (typically `registerWithDocuserve(pict)`) which
 * calls `register()` here with one or more demo entries.
 *
 * # Demo entry shape (schema v1)
 *
 *   {
 *     DemoSchemaVersion: <number?>  - defaults to 1.  Bump when a library
 *                                     uses fields added in a later
 *                                     schema; older docuserve versions
 *                                     reject the entry with a warning.
 *     Hash:        <string>   - unique within (Group, Module) (e.g. 'login-form')
 *     Group:       <string>   - the catalog group key (e.g. 'pict')
 *     Module:      <string>   - the module name (e.g. 'pict-section-form')
 *     Name:        <string>   - human-readable label for the sidebar / title
 *     Description: <string>   - one-paragraph summary (rendered above the demo)
 *     Spec:        <object>   - JSON config the Mount function consumes
 *     Mount:       <function> - signature (pict, container, spec) => void
 *                               renders the live demo inside `container`
 *     Sources:     <array>    - optional [{ Name, Language, Content }] tabs
 *                               for the source viewer (uses pict-section-code)
 *     Playground:  <bool?>    - opt-in to the editable spec mode.  Reserved
 *                               for a future revision; ignored by the first
 *                               cut of the demo view.
 *   }
 *
 * # Lookups
 *
 *   provider.register(entry)          - add a single entry (returns the stored entry)
 *   provider.registerAll(entries)     - bulk register an array
 *   provider.get(group, module, hash) - resolve by route triple
 *   provider.listAll()                - every registered entry, in registration order
 *   provider.listByModule(g, m)       - entries scoped to one module (sidebar grouping)
 *   provider.hasDemos(g, m)           - quick truthy check
 *   provider.maxSchemaVersion         - highest schema version this provider supports
 *
 * # Why a registry instead of a catalog file
 *
 * Demos ship inside their host library's bundle so they version with the
 * code they exercise.  Each library calls `pict.providers['Docuserve-Demos']
 * .registerAll(...)` at boot; the registry is purely in-memory.  No
 * build-time generation step, no stale catalog drift.
 */
class PictProviderDocuserveDemos extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this._byKey = {};         // Group/Module/Hash → entry
		this._byModule = {};      // Group/Module → entry[] (insertion order)
		this._all = [];           // every entry, in registration order
	}

	/**
	 * Highest demo entry schema version this provider can register.
	 * Exposed for libraries that want to feature-detect before calling
	 * register() (e.g. to skip a v2 entry on a v1-only docuserve).
	 *
	 * @type {number}
	 */
	get maxSchemaVersion()
	{
		return MAX_DEMO_SCHEMA_VERSION;
	}

	/**
	 * Register one demo entry.  Re-registering the same Group/Module/Hash
	 * overwrites cleanly (useful for hot-reload scenarios).
	 *
	 * @param {object} pEntry
	 * @returns {object|null} the stored entry, or null if the shape was invalid
	 */
	register(pEntry)
	{
		if (!pEntry || typeof pEntry !== 'object')
		{
			this.log.warn('Docuserve-Demos.register: entry must be an object');
			return null;
		}

		// Schema-version gate.  Older docuserve instances reject entries
		// that declare a schema version they can't honour; the library
		// that produced the entry was authored against newer docuserve
		// features.  Defaults to 1 when omitted (the v1 contract).
		let tmpSchemaVersion = (typeof pEntry.DemoSchemaVersion === 'number') ? pEntry.DemoSchemaVersion : 1;
		if (tmpSchemaVersion > MAX_DEMO_SCHEMA_VERSION)
		{
			this.log.warn('Docuserve-Demos.register: entry schema v' + tmpSchemaVersion
				+ ' exceeds this provider\'s max v' + MAX_DEMO_SCHEMA_VERSION
				+ ' — skipping ' + (pEntry.Group || '?') + '/' + (pEntry.Module || '?') + '/' + (pEntry.Hash || '?')
				+ '.  Upgrade pict-docuserve to register newer-schema demos.');
			return null;
		}

		if (typeof pEntry.Hash !== 'string' || pEntry.Hash.length < 1)
		{
			this.log.warn('Docuserve-Demos.register: entry.Hash is required');
			return null;
		}
		if (typeof pEntry.Group !== 'string' || pEntry.Group.length < 1)
		{
			this.log.warn('Docuserve-Demos.register: entry.Group is required (e.g. "pict")');
			return null;
		}
		if (typeof pEntry.Module !== 'string' || pEntry.Module.length < 1)
		{
			this.log.warn('Docuserve-Demos.register: entry.Module is required (e.g. "pict-section-form")');
			return null;
		}
		if (typeof pEntry.Mount !== 'function')
		{
			this.log.warn('Docuserve-Demos.register: entry.Mount must be a function (pict, container, spec)');
			return null;
		}

		let tmpKey = pEntry.Group + '/' + pEntry.Module + '/' + pEntry.Hash;
		let tmpModuleKey = pEntry.Group + '/' + pEntry.Module;

		// Replace existing if any (in-place to preserve order).
		let tmpExisting = this._byKey[tmpKey];
		if (tmpExisting)
		{
			let tmpAllIdx = this._all.indexOf(tmpExisting);
			if (tmpAllIdx >= 0) { this._all[tmpAllIdx] = pEntry; }
			let tmpModList = this._byModule[tmpModuleKey] || [];
			let tmpModIdx = tmpModList.indexOf(tmpExisting);
			if (tmpModIdx >= 0) { tmpModList[tmpModIdx] = pEntry; }
			this._byKey[tmpKey] = pEntry;
			return pEntry;
		}

		this._byKey[tmpKey] = pEntry;
		this._all.push(pEntry);
		if (!this._byModule[tmpModuleKey]) { this._byModule[tmpModuleKey] = []; }
		this._byModule[tmpModuleKey].push(pEntry);
		return pEntry;
	}

	/**
	 * Bulk-register an array of demos.  Skips entries that fail validation;
	 * the caller's own console will already have the per-entry warnings.
	 *
	 * @param {Array<object>} pEntries
	 * @returns {number} count of successfully registered entries
	 */
	registerAll(pEntries)
	{
		if (!Array.isArray(pEntries)) { return 0; }
		let tmpCount = 0;
		for (let i = 0; i < pEntries.length; i++)
		{
			if (this.register(pEntries[i])) { tmpCount++; }
		}
		return tmpCount;
	}

	get(pGroup, pModule, pHash)
	{
		return this._byKey[pGroup + '/' + pModule + '/' + pHash] || null;
	}

	listAll()
	{
		return this._all.slice();
	}

	listByModule(pGroup, pModule)
	{
		let tmpList = this._byModule[pGroup + '/' + pModule];
		return tmpList ? tmpList.slice() : [];
	}

	hasDemos(pGroup, pModule)
	{
		let tmpList = this._byModule[pGroup + '/' + pModule];
		return !!(tmpList && tmpList.length > 0);
	}
}

module.exports = PictProviderDocuserveDemos;
module.exports.default_configuration =
{
	ProviderIdentifier: 'Docuserve-Demos'
};
module.exports.MAX_DEMO_SCHEMA_VERSION = MAX_DEMO_SCHEMA_VERSION;
