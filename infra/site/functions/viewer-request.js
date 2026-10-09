// CloudFront Function, viewer request, runtime cloudfront-js-2.0.
//
// The site is a Next.js static export with trailingSlash: true, so every page
// is a folder with an index.html. S3 behind Origin Access Control does not
// resolve folder indexes, so this function adds index.html to a folder path.
//
// A page path without the trailing slash gets a 301 to the slash form, so each
// page has one URL. A path whose last segment has a dot is a file, and passes
// through unchanged. A request to www gets a 301 to the apex, with the slash
// fix in the same hop.

var WWW_PREFIX = "www.";

// Turns the event's querystring object back into "?a=1&b=2". A parameter with
// no value stays "?flag". Each value goes back exactly as the event holds it.
function serializeQuerystring(querystring) {
  var parts = [];
  for (var key in querystring) {
    var field = querystring[key];
    var values = field.multiValue ? field.multiValue : [field];
    for (var i = 0; i < values.length; i++) {
      parts.push(values[i].value === "" ? key : key + "=" + values[i].value);
    }
  }
  return parts.length > 0 ? "?" + parts.join("&") : "";
}

function isPageWithoutSlash(uri) {
  if (uri.endsWith("/")) return false;
  var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);
  return lastSegment.indexOf(".") === -1;
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: { location: { value: location } },
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- CloudFront calls handler by name.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value : "";
  var isWww = host.indexOf(WWW_PREFIX) === 0;

  if (isWww || isPageWithoutSlash(uri)) {
    var origin = isWww ? "https://" + host.substring(WWW_PREFIX.length) : "";
    var path = isPageWithoutSlash(uri) ? uri + "/" : uri;
    return redirect(origin + path + serializeQuerystring(request.querystring));
  }

  if (uri.endsWith("/")) {
    request.uri = uri + "index.html";
  }

  return request;
}
