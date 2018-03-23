
let cheerio = require('cheerio');

function postprocessIgem(html) {
  let $ = cheerio.load(html);

  $('#sequencePaneDiv').remove();
  $('script').remove();
  $('.compatibility_div').parent().parent().remove();

  $('img').each((i, img) => {
    let $img = $(img);

    let src = $img.attr('src');
    let srcset = $img.attr('srcset');

    if (src) {
      src = src.replace(/(^|\s)\/wiki/g, 'http://parts.igem.org/wiki');
      $img.attr('src', src);
    }

    if (srcset) {
      srcset = srcset.replace(/(^|\s)\/wiki/g, 'http://parts.igem.org/wiki');
      $img.attr('srcset', srcset);
    }
  });

  return $.html();
}

module.exports = postprocessIgem;
