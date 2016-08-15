<h1>{{title}}</h1>
{{img "x.png" title="logo"}}
{{#if list}}
    {{> './partial.tpl'}}
{{else}}
    sorry, no list.
{{/if}}