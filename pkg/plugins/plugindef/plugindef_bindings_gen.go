// THIS FILE IS GENERATED. EDITING IS FUTILE.
//
// Generated by:
//     pkg/plugins/plugindef/gen.go
// Using jennies:
//     PluginGoBindings
//
// Run 'make gen-cue' from repository root to regenerate.

package plugindef

import (
	"cuelang.org/go/cue/build"
	"github.com/grafana/thema"
)

// Lineage returns a [thema.ConvergentLineage] for the 'plugindef' Thema lineage.
//
// The lineage is the canonical specification of plugindef. It contains all
// schema versions that have ever existed for plugindef, and the lenses that
// allow valid instances of one schema in the lineage to be translated to
// another schema in the lineage.
//
// As a [thema.ConvergentLineage], the returned lineage has one primary schema, 0.0,
// which is [thema.AssignableTo] [*PluginDef], the lineage's parameterized type.
//
// This function will return an error if the [Thema invariants] are not met by
// the underlying lineage declaration in CUE, or if [*PluginDef] is not
// [thema.AssignableTo] the 0.0 schema.
//
// [Thema's general invariants]: https://github.com/grafana/thema/blob/main/docs/invariants.md
func Lineage(rt *thema.Runtime, opts ...thema.BindOption) (thema.ConvergentLineage[*PluginDef], error) {
	lin, err := baseLineage(rt, opts...)
	if err != nil {
		return nil, err
	}

	sch := thema.SchemaP(lin, thema.SV(0, 0))
	typ := new(PluginDef)
	tsch, err := thema.BindType(sch, typ)
	if err != nil {
		// This will error out if the 0.0 schema isn't assignable to
		// *PluginDef. If Thema also generates that type, this should be unreachable,
		// barring a critical bug in Thema's Go generator.
		return nil, err
	}
	return tsch.ConvergentLineage(), nil
}

func baseLineage(rt *thema.Runtime, opts ...thema.BindOption) (thema.Lineage, error) {
	// First, we must get the bytes of the .cue file(s) in which the "plugindef" lineage
	// is declared, and load them into a
	// "cuelang.org/go/cue/build".Instance.
	//
	// For most Thema-based development workflows, these bytes should come from an embed.FS.
	// This ensures Go is always compiled with the current state of the .cue files.
	var inst *build.Instance
	var err error

	// loadInstanceForplugindef must be manually implemented in another file in this
	// Go package.
	inst, err = loadInstanceForplugindef()
	if err != nil {
		// Errors at this point indicate a problem with basic loading of .cue file bytes,
		// which typically means the code generator was misconfigured and a path input
		// is incorrect.
		return nil, err
	}

	raw := rt.Context().BuildInstance(inst)

	// An error returned from thema.BindLineage indicates one of the following:
	//   - The parsed path does not exist in the loaded CUE file (["github.com/grafana/thema/errors".ErrValueNotExist])
	//   - The value at the parsed path exists, but does not appear to be a Thema
	//     lineage (["github.com/grafana/thema/errors".ErrValueNotALineage])
	//   - The value at the parsed path exists and is a lineage (["github.com/grafana/thema/errors".ErrInvalidLineage]),
	//     but is invalid due to the violation of some general Thema invariant -
	//     for example, declared schemas don't follow backwards compatibility rules,
	//     lenses are incomplete.
	return thema.BindLineage(raw, rt)
}

// type guards
var _ thema.ConvergentLineageFactory[*PluginDef] = Lineage
var _ thema.LineageFactory = baseLineage
