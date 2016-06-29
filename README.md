# sugar-template[![Build Status](https://travis-ci.org/creeperyang/sugar-template.svg?branch=master)](https://travis-ci.org/creeperyang/sugar-template)

> A simple template engine based on `mustache.js`.

## Install

[![NPM](https://nodei.co/npm/sugar-template.png)](https://nodei.co/npm/sugar-template/)

## Usage

```js
const sugar = require('sugar-template')

sugar.render(`{{title | uppercase}}`, { title: 'test' }) // --> 'TEST'
sugar.render(`{{#each user}}{{.}} {{/each}}`, {
    user: {
        name: 'Mike',
        age: 18,
        gender: 'M'
    }
})
// --> Mike 18 M
```

### Syntax

1. Expression, `{{varialbe}}`, starts with `{{` and ends with `}}`.

2. HTML escaping. Normal expression will be automatically escaped. So, use `{{{varialbe}}}` if you don't want escaping.

3. Helpers. Almost like `handlebars`, `{{#helper context}} {{/helper}}`.

4. Inline helpers. `{{helper context}}`.

5. Filters. `{{context | filter}}`.

### API

#### `sugar.render(String: template, Object: data, Object|Function: partials)`

Render template to string.

#### `sugar.parse(String: template[, Array: tags])`

Parse template to token tree.

## License

MIT
