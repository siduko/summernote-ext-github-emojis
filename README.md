Print plugin for Summernote
===========================

This plugin allows summernote prints its document, not whole web page.

DEMO PAGE : <http://siduko.github.io/summernote-ext-github-emojis/>


USAGE
-----

 1. Install library:
    If you're using bower, than just type `bower install summernote-ext-github-emojis`,
    If you're using npm, `npm install summernote-ext-github-emojis`,
    or download and copy summernote-ext-github-emojis to your own directory.

 2. Embed `summernote-ext-github-emojis.js` into your page.

 3. Configure the toolbar of summernote like below.

```
$('#summernote').summernote({
    toolbar: [
        ...
        ['misc', ['emojis']]
    ],
    ...
});
```

Hint
-------
  Type starting with `:` and any alphabet, example: `:taco` to show hint ![:taco:](https://assets-cdn.github.com/images/icons/emoji/unicode/1f32e.png?v7)


AUTHOR
------
[@siduko](https://github.com/siduko/)
[https://siduko.github.io](https://siduko.github.io)


LICENSE
-------
MIT
