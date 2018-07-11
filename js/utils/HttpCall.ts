class HttpCall {
  post(url :string, body :any, callback :any, async = true) {
    let xhttp :any;
    let legacyMode = false;

    if ((window as any).XDomainRequest) {
      legacyMode = true;
    }

    if (legacyMode) {
      xhttp = new (window as any).XDomainRequest();
    } else {
      xhttp = new XMLHttpRequest();
    }

    const responseCallback = function() {
      if (xhttp.readyState == XMLHttpRequest.DONE) {
        if (xhttp.responseText <= 0) {
          return;
        }

        const sampleResponse = JSON.parse(xhttp.responseText);

        callback(sampleResponse);
      }
    };

    if (legacyMode) {
      xhttp.onload = responseCallback;
    } else {
      xhttp.onreadystatechange = responseCallback;
    }

    xhttp.open('POST', url, async);
    if (!legacyMode) {
      xhttp.setRequestHeader('Content-Type', 'text/plain');
    }
    xhttp.send(JSON.stringify(body));
  }
}

export default HttpCall;
