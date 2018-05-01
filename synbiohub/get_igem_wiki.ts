
import cheerio from 'cheerio';
import request from 'request';

export default async function getIgemWiki(url) {

    var ret = {}

    await Promise.all([

        new Promise((resolve, reject) => {

            request.get(url.toString() + '?action=render', function(err, res, body) {

                if(err) {
                    resolve()
                    //reject(err)
                    return
                }

                if(res.statusCode >= 300) {
                    resolve()
                    //reject(new Error('HTTP ' + res.statusCode))
                    return
                }

                ret.iGemMainPage = body
                if (ret.iGemMainPage != '') {
                    ret.iGemMainPage = postprocess_igem(ret.iGemMainPage.toString())
                }

                resolve()
            })
        }),


        new Promise((resolve, reject) => {

            request.get(url.toString() + ':Design?action=render', function(err, res, body) {

                if(err) {
                    //reject(err)
                    resolve()
                    return
                }

                if(res.statusCode >= 300) {
                    //reject(new Error('HTTP ' + res.statusCode))
                    resolve()
                    return
                }

                ret.iGemDesign = body
                if (ret.iGemDesign != '') {
                    ret.iGemDesign = postprocess_igem(ret.iGemDesign.toString())
                }

                resolve()
            })
        }),


        new Promise((resolve, reject) => {

            request.get(url.toString() + ':Experience?action=render', function(err, res, body) {

                if(err) {
                    //reject(err)
                    resolve()
                    return
                }

                if(res.statusCode >= 300) {
                    //reject(new Error('HTTP ' + res.statusCode))
                    resolve()
                    return
                }

                ret.iGemExperience = body
                if (ret.iGemExperience != '') {
                    ret.iGemExperience = postprocess_igem(ret.iGemExperience.toString())
                }

                resolve()
            })
        })

    ])


    return ret

};


function postprocess_igem(html) {

	var $ = cheerio.load(html)

	$('#sequencePaneDiv').remove()
	$('script').remove()
	$('.compatibility_div').parent().parent().remove()
	
	$('img').each((i, img) => {

		var $img = $(img)

		var src = $img.attr('src')
		var srcset = $img.attr('srcset')

		if(src) {
			src = src.replace(/(^|\s)\/wiki/g, 'http://parts.igem.org/wiki')
			$img.attr('src', src)
		}

		if(srcset) {
			srcset = srcset.replace(/(^|\s)\/wiki/g, 'http://parts.igem.org/wiki')
			$img.attr('srcset', srcset)
		}
	})

	return $.html()
}


