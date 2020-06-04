let Nunjucks = require("nunjucks");  
const crypto = require('crypto');
const xmlFiltersPlugin = require('eleventy-xml-plugin');
const pluginRss = require("@11ty/eleventy-plugin-rss");
module.exports = function (eleventyConfig) {
  let nunjucksEnvironment = new Nunjucks.Environment(
    new Nunjucks.FileSystemLoader("_includes")
  );
  eleventyConfig.setLibrary("njk", nunjucksEnvironment);
  eleventyConfig.addPlugin(xmlFiltersPlugin);
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("build");
  eleventyConfig.addPassthroughCopy({"posts" : "pages"});
  eleventyConfig.addPassthroughCopy("build.js");
  eleventyConfig.addPassthroughCopy("wc-registry.json");
  eleventyConfig.addPassthroughCopy("service-worker.js");
  eleventyConfig.setTemplateFormats(["html","md", "njk"]);
  eleventyConfig.addCollection("manifest", function (collection) {
    const settings = collection.items[0].data.haxcms.settings;
    return JSON.stringify({
      name: settings.siteName,
      short_name: settings.siteName,
      description: settings.siteDescription,
      icons: [
        {
          "src": settings.basePath + "assets/android-icon-36x36.png",
          "sizes": "36x36",
          "type": "image/png",
          "density": "0.75"
        },
        {
          "src": settings.basePath + "assets/android-icon-48x48.png",
          "sizes": "48x48",
          "type": "image/png",
          "density": "1.0"
        },
        {
          "src": settings.basePath + "assets/android-icon-72x72.png",
          "sizes": "72x72",
          "type": "image/png",
          "density": "1.5"
        },
        {
          "src": settings.basePath + "assets/android-icon-96x96.png",
          "sizes": "96x96",
          "type": "image/png",
          "density": "2.0"
        },
        {
          "src": settings.basePath + "assets/android-icon-144x144.png",
          "sizes": "144x144",
          "type": "image/png",
          "density": "3.0"
        },
        {
          "src": settings.basePath + "assets/android-icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "density": "4.0"
        },
        {
          "src": settings.basePath + "assets/ms-icon-310x310.png",
          "sizes": "512x512",
          "type": "image/png",
          "density": "4.0"
        }
      ],
      scope: settings.basePath,
      start_url: settings.basePath,
      display: "standalone",
      theme_color: settings.hexCode,
      background_color: settings.hexCode,
      url: settings.url,
      lang: settings.lang,
      screenshots: [],
      orientation: "portrait"
    }, null, 2);
  });
  eleventyConfig.addCollection("swHashData", function (collection) {
    const settings = collection.items[0].data.haxcms.settings;
    const items = collection.items.map(({ outputPath, url, data }, i) => {
      if (!url.includes("/build/")) {
        return [
          url,
          hashFromValue(data.page.date.toString()).substr(0, 16).replace(/\//g,'z').replace(/\+/g,'y').replace(/\=/g,'x').replace(/\-/g,'w', collection.items[0].data.haxcms.settings.siteUuid)
        ];
      }
    });
    const itemsFiltered = items.filter((item) => {
      if (item && item.length > 0) {
        return true;
      }
      return false;
    });
    return JSON.stringify(itemsFiltered, null, 2);
  });
  // simplify access to the flobal settings
  eleventyConfig.addCollection("globals", function (collection) {
    return collection.items[0].data.haxcms.settings;
  });
  eleventyConfig.addCollection("haxcms", function (collection) {
    const settings = collection.items[0].data.haxcms.settings;
    const items = collection.items.map(({ outputPath, inputPath, url, data }, i) => {
      if (url.includes("/posts/")) {
        let parentID = null;
        // parent test path
        let test = inputPath.split('/');
        test.pop();
        // you have to use index.whatever for accurate parent nesting
        test = (test.join('/') + '/index.').replace(/\./g,'-').replace(/\//g,'-');
        // ensure that we don't set ourselves as the parent
        if (test != inputPath.replace('md', '').replace('html', '').replace('njk', '').replace(/\./g,'-').replace(/\//g,'-')) {
          data.collections.post.forEach((item) => {
            if (item.inputPath.replace('md', '').replace('html', '').replace('njk', '').replace(/\./g,'-').replace(/\//g,'-') == test) {
              parentID = item.inputPath.replace(/\./g,'-').replace(/\//g,'-');
            }
          });
        }
        // @todo try and wire this up after verifying this file exists
        // if the file exists then we know it's a parent of the current folder in the tree
        // which means we can set the parent id and it'll work
        let slug = url.split('/');
        slug.shift();
        slug = slug.join('/');
        return {
          id: inputPath.replace(/\./g,'-').replace(/\//g,'-'),
          indent: 0,
          location: inputPath.replace('/posts/','/pages/'),
          slug: slug,
          order: i,
          title: data.title ? data.title : 'Title',
          description: data.title ? data.title : 'Description',
          parent: parentID,
          metadata: {
            created: Date.now(),
            updated: Date.now(),
            readtime: 0,
            contentDetails: {},
            files: []
          }
        };
      }
    });
    const pageItems = items.filter((item) => {
      if (item && item.slug) {
        return true;
      }
      return false;
    });
    return JSON.stringify({ 
      id: settings.siteUuid,
      title: settings.siteName,
      author: settings.siteAuthorName,
      description: settings.siteDescription,
      license: settings.siteLicense,
      metadata: {
        author: {
          image: settings.siteAuthorImage,
          name: settings.siteAuthorName,
          email: settings.siteAuthorEmail,
          socialLink: "https://twitter.com/" + settings.twitterName
        },
        site: {
          name: settings.siteMachineName,
          created: Date.now(),
          updated: Date.now(),
          git: {
            autoPush: false,
            branch: "master",
            staticBranch: "gh-pages",
            vendor: "github",
            publicRepoUrl: "https://github.com/btopro/ist402/blob/master/",
            url: "git@github.com:btopro/ist402.git"
          },
          version: "1.1.2",
          domain: "",
          logo: settings.siteLogo,
          static: {
            cdn: "build",
            offline: false
          },
          settings: {
            pathauto: false,
            publishPagesOn: false,
            forceUpgrade: true,
            sw: false
          }
        },
        theme: {
          element: "learn-two-theme"
        }
      },
      items: pageItems
    }, null, 2);
  });

  eleventyConfig.addShortcode("getLicenseInfo", function(license, varName) {
    return getLicenseInfo(license)[varName];
  });
};
/**
 * License data for common open license
 */
function getLicenseInfo(license = 'by-sa')
{
    let list = {
        "by":{
            'name':"Creative Commons: Attribution",
            'link':"https://creativecommons.org/licenses/by/4.0/",
            'image':"https://i.creativecommons.org/l/by/4.0/88x31.png"
        },
        "by-sa":{
            'name':"Creative Commons: Attribution Share a like",
            'link':"https://creativecommons.org/licenses/by-sa/4.0/",
            'image':"https://i.creativecommons.org/l/by-sa/4.0/88x31.png"
        },
        "by-nd":{
            'name':"Creative Commons: Attribution No derivatives",
            'link':"https://creativecommons.org/licenses/by-nd/4.0/",
            'image':"https://i.creativecommons.org/l/by-nd/4.0/88x31.png"
        },
        "by-nc":{
            'name':"Creative Commons: Attribution non-commercial",
            'link':"https://creativecommons.org/licenses/by-nc/4.0/",
            'image':"https://i.creativecommons.org/l/by-nc/4.0/88x31.png"
        },
        "by-nc-sa":{
            'name' :
                "Creative Commons: Attribution non-commercial share a like",
            'link':"https://creativecommons.org/licenses/by-nc-sa/4.0/",
            'image' :
                "https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png"
        },
        "by-nc-nd":{
            'name' :
                "Creative Commons: Attribution Non-commercial No derivatives",
            'link':"https://creativecommons.org/licenses/by-nc-nd/4.0/",
            'image' :
                "https://i.creativecommons.org/l/by-nc-nd/4.0/88x31.png"
        }
    };
    if (list[license]) {
      return list[license];
    }
    return {};
}
function hashFromValue(value = '', uuid = '')
{
  return hmacBase64(value, uuid);
}
function hmacBase64(data, key)
{
  var buf1 = crypto.createHmac("sha256", "0").update(data).digest();
  var buf2 = Buffer.from(key);
  // generate the hash
  return Buffer.concat([buf1, buf2]).toString('base64');
}