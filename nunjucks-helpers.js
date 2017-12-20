const cheerio = require('cheerio');
const nunjucksIncludeData = require('nunjucks-includeData');
const marky = require('marky-markdown');
const nunjucksMarkdown = require('nunjucks-markdown');

const stripEverythingBeforeH2Element = true;

function generateSlug (str) {
  // Adapted from https://gist.github.com/mathewbyrne/1280286#gistcomment-1761979
  str = (str || '').replace(/^\s+|\s+$/g, '');  // Trim whitespace.
  str = str.toLowerCase();

  // Replace accents with their latin equivalents (e.g., swap ñ for n).
  var before = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
  var after  = 'aaaaeeeeiiiioooouuuunc______';

  for (var i = 0, len = before.length; i < len; i++) {
    str = str.replace(new RegExp(before.charAt(i), 'g'), after.charAt(i));
  }

  str = str.replace(/-+/g, '_')  // Collapse dashes to underscores.
    .replace(/&/g, '_')  // Replace ampersands with underscores.
    .replace(/\./g, '_')  // Collapse dashes to underscores.
    .replace(/\s+/g, '_')  // Collapse whitespace to underscores.
    .replace(/_+/g, '_')  // Collapse underscores.
    .replace(/\W/g, '');  // Remove unaccepted characters.

  return str;
}

const slugify = slug => generateSlug(slug.replace('setup-instructions', 'setup'));

module.exports = function (nunjucksEnv) {
  nunjucksIncludeData.install(nunjucksEnv);

  nunjucksMarkdown.register(nunjucksEnv, str => {
    let dirty = marky(str, {
      headingSvgClass: [],
      prefixHeadingIds: false,
      enableHeadingLinkIcons: false
    });

    // Remove everything before the first `<h2>` element.
    if (stripEverythingBeforeH2Element) {
      dirty = dirty.substring(dirty.indexOf('<h2'));
    }

    let $ = cheerio.load(dirty);

    $('ol, ul').each((idx, list) => {
      const $list = $(list);
      $list.addClass('bullets-light');
      $list.html($list.html().replace(/<li>/gi, '<li><span>').replace(/<\/li>/gi, '</span></li>'));
    });

    let html = '';
    let sections = [];

    $('h2 > a').each((idx, a) => {
      const $a = $(a);

      const $h2 = $a.parent();

      const id = slugify($a.attr('id'));
      $h2.attr('id', id);

      $a.removeAttr('aria-hidden');

      const href = `#${id}`;
      $a.attr('href', href);

      const headingText = $h2.text();
      $a.text(headingText);

      $h2.html($a);

      if (!html) {
        const bodyHtml = $('body').html();
        html = bodyHtml.substring(0, bodyHtml.indexOf('<h2'));
      }

      let sectionHtml = `<section data-section="${id}" id="${id}" class="section">\n`;
      sectionHtml += `${$.html($h2)}\n`;
      $h2.nextUntil('h2').each((idx, sibling) => {
        const $sibling = $(sibling);
        sectionHtml += $.html($sibling) + '\n';
        $sibling.remove();
      });
      sectionHtml += '</section>\n';

      sections.push(sectionHtml);
    });

    if (sections.length) {
      html += sections.join('\n\n');
    } else {
      html = $('body').html();
    }

    $ = cheerio.load(html);

    $('h3').each((idx, h3) => {
      const $h3 = $(h3);

      const headingText = $h3.text();

      const $a = $h3.find('a');
      $a.removeAttr('aria-hidden');
      $a.text(headingText);
      // $h3.wrap('<a></a>');

      const id = slugify(headingText);
      console.log('id', id);
      $h3.attr('id', id);

      const href = `#${id}`;
      $a.attr('href', href);

      $h3.html($a);
    });

    return $('body').html();
  });
};
