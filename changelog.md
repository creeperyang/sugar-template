### v2.0.1

1. See <https://github.com/creeperyang/sugar-template/issues/11>

### v2.0.0

1. update `Context` constructor, support specify dot `{{.}}` value.
2. change meta data access: `{{$$prop}}` --> `{{$prop}}`.

### v1.1.2

1. fix `parseFilter`.
2. fix `parseParamsString`.

### v1.1.1

1. `new Context(null)` fix lookup error when context data is null.

### v1.1.0

1. `{{! comment}}` support comment tag.

### v1.0.2

1. `if/unless/each` helpers won't escape html.

### v1.0.0

1. remove switch tag.
2. {{= text =}} now serves as `handlebars`'s `{{{{text}}}}` (sugar will not compile text inside it).
3. improve ast interface and constructor.
4. support both `this` and `.`.
5. export API change.
