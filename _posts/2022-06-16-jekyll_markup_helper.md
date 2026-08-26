---
layout:     post
title:      Jekyll markup helper
date:       2022-06-16 00:00:00
author:     Luke Wakefield
summary:    A quick reference to the Markdown and Jekyll syntax used on this site.
categories: jekyll
thumbnail: book
tags:
 - jekyll
 - markdown
 - kramdown
 - reference
---

A quick reference to the Markdown and Jekyll syntax supported by this site
(kramdown with GitHub-Flavoured Markdown (GFM)). Each example below shows the source
syntax in a `text` code block so it is not rendered or highlighted.

## Text formatting

~~~text
**bold** or __bold__
*italic* or _italic_
***bold italic*** or ___bold italic___
~~strikethrough~~
`inline code`
~~~

## Headings

~~~text
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
~~~

## Paragraphs and line breaks

~~~text
Leave a blank line between paragraphs.

End a line with two trailing spaces  
to force a line break.
~~~

Horizontal rules use three or more dashes, asterisks or underscores:

~~~text
---
***
___
~~~

## Links

~~~text
[inline link](https://example.com)
[link with title](https://example.com "Example")
[reference link][ref]

[ref]: https://example.com "Defined anywhere in the document"
~~~

A bare Uniform Resource Locator (URL) in angle brackets becomes a link:

~~~text
<https://example.com>
~~~

## Images

~~~text
![alt text](/images/example.jpg)
![alt text](/images/example.jpg "title")
![alt text][img-ref]

[img-ref]: /images/example.jpg
~~~

Wrap an image in a link to make it clickable:

~~~text
[![alt text](/images/example.jpg)](https://example.com)
~~~

For extra attributes use a HyperText Markup Language (HTML) image tag:

~~~text
<img src="/images/example.jpg" alt="alt text" width="400" height="300" loading="lazy">
~~~

## Lists

~~~text
- item
- item
  - nested item
    - deeper item

1. first
2. second
   1. nested
~~~

Task lists:

~~~text
- [ ] to do
- [x] done
~~~

## Code

Inline code uses single backticks: `` `code` ``. Fenced code blocks use triple
backticks with an optional language:

~~~text
```bash
echo "hello"
```
~~~

Tilde fences work too:

```text
~~~js
console.log("hello");
~~~
```

You can also indent a block by four spaces:

~~~text
    indented code block
~~~

## Blockquotes

~~~text
> A blockquote.

> A nested quote:
> > inner quote
~~~

## Tables

~~~text
| Header 1 | Header 2 |
| -------- | -------- |
| cell     | cell     |
~~~

## Footnotes

~~~text
Text with a footnote[^1].

[^1]: The footnote content.
~~~

## Raw HTML

kramdown passes raw HTML through:

~~~text
<details>
<summary>Click to expand</summary>
Hidden content.
</details>
~~~

## Liquid

Jekyll runs every post through the Liquid template engine before converting
Markdown, so brace-based variables and tags (such as the page title or an
include) are evaluated. To show that syntax literally, wrap it in a `raw`
block: `{{ "{%" }} raw %}` … `{{ "{%" }} endraw %}`.

{% raw %}
~~~text
{{ page.title }}
{% highlight bash %}
echo "hello"
{% endhighlight %}
~~~
{% endraw %}

## Post front matter

Every post starts with YAML Ain't Markup Language (YAML) front matter between `---` lines:

~~~text
---
layout:     post
title:      Post title
date:       2022-06-16 09:00:00
author:     Luke Wakefield
summary:    One-line summary.
categories: jekyll
thumbnail: book
tags:
 - jekyll
 - markdown
---
~~~

## Post thumbnail

Set `thumbnail` to a Font Awesome icon name to render an icon, or map an image
in `_data/thumbnail.yml`:

~~~text
thumbnail: heart     # Font Awesome icon
thumbnail: gravatar   # image via _data/thumbnail.yml
~~~

## Other

Escaping, entities and attribute lists:

~~~text
\*literal asterisks\*          escape Markdown characters
&copy; &mdash; &lt; &gt; &amp;  HTML entities
&nbsp;                         non-breaking space
{: .class}                     kramdown inline attribute list
~~~
