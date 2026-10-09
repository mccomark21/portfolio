// CloudFront Function, viewer request, runtime cloudfront-js-2.0.
//
// The site is a Next.js static export with trailingSlash: true, so every page
// is a folder with an index.html. S3 behind Origin Access Control does not
// resolve folder indexes, so this function adds index.html to the URI.
//
// A page path without the trailing slash gets a 301 to the slash form, so each
// page has one URL. A path whose last segment has a dot is a file, and passes
// through unchanged. A request to www gets a 301 to the apex.

function querystringOf(querystring) {
  var parts = [];
  for (var key in querystring) {
    var field = querystring[key];
    var values = field.multiValue ? field.multiValue : [field];
    for (var i = 0; i < values.length; i++) {
      parts.push(key + "=" + values[i].value);
    }
  }
  return parts.length > 0 ? "?" + parts.join("&") : "";
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: { location: { value: location } },
  };
}

function isPageWithoutSlash(uri) {
  if (uri.endsWith("/")) return false;
  var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);
  return lastSegment.indexOf(".") === -1;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- CloudFront calls handler by name.
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value : "";

  // www has one destination: the apex. The slash fix happens in the same hop.
  if (host.indexOf("www.") === 0) {
    var path = isPageWithoutSlash(uri) ? uri + "/" : uri;
    return redirect("https://" + host.substring(4) + path + querystringOf(request.querystring));
  }

  if (isPageWithoutSlash(uri)) {
    return redirect(uri + "/" + querystringOf(request.querystring));
  }

  if (uri.endsWith("/")) {
    request.uri = uri + "index.html";
  }

  return request;
}
