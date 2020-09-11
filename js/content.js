
$.ajaxSetup({
    headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    }
});

// Avoid recursive frame insertion...
var extensionOrigin = 'chrome-extension://' + chrome.runtime.id;

const getToolbarIndex = (extensionUrl, webDoc) => {
    $.ajax({
        type:"GET",
        url: `${extensionUrl}/frontend/index.html`,
        success: (res) => {

            let parser = new DOMParser(),
                doc = parser.parseFromString(res, "text/html"),
                toolbar = doc.querySelector('.js-wtg-toolbar'),
                toolbarModal = doc.querySelector('.js-wtg-toolbar-modal'),
                styles = document.createElement('link'),
                allImg = doc.querySelectorAll('img'),
                scripts = document.createElement('script');

            //Set styles and scripts
            styles.setAttribute('rel', 'stylesheet');
            styles.setAttribute('type', 'text/css');
            styles.setAttribute('href', `${extensionUrl}/frontend/css/styles.min.css`);
            scripts.setAttribute('src', `${extensionUrl}/frontend/js/script.min.js`);

            //Set image url
            allImg.forEach( el => {
                let src = el.getAttribute('src');

                switch (src.slice(0, 3)) {
                    case 'img':
                        src.replace('img',`${extensionUrl}/frontend/img`);
                        el.setAttribute('src', `${extensionUrl}/frontend/${src}`);
                    case 'svg':
                        src.replace('img',`${extensionUrl}/frontend/svg`);
                        el.setAttribute('src', `${extensionUrl}/frontend/${src}`);
                }

            });

            //insert styles
            webDoc.head.appendChild(styles);
            webDoc.body.appendChild(toolbar);
            webDoc.body.appendChild(toolbarModal);
            webDoc.body.appendChild(scripts);

        }
    });
}

if (!location.ancestorOrigins.contains(extensionOrigin)) {
    getToolbarIndex(extensionOrigin, document);

    // var iframe = document.createElement('div');
    // // Must be declared at web_accessible_resources in manifest.json
    // iframe.src = chrome.runtime.getURL('iframe.html');
    //
    // // Some styles for a fancy sidebar
    // iframe.style.cssText = 'position:fixed; top:0; left:0; display:block; ' +
    //     'width:100%; height:auto; z-index:1000; border: none';
    // iframe.setAttribute('id', 'wtg-toolbar-iframe');
    //
    // // document.body.appendChild(iframe);
    // $('body')

}

// console.log(`${extensionOrigin}/frontend/index.html`);
//
// fetch(`${extensionOrigin}/frontend/index.html`,{
//     mode: 'no-cors',
//     headers: {
//         'Content-Type': 'text/html'
//     }
// })
//     .then((res) => {
//         console.log(res);
//         switch (res.status) {
//             case 200:
//                 return res.text();
//             case 404:
//                 console.log(res);
//         }
//     })
//     .then( (template) => {
//
//         console.log(template);
//
//         let parser = new DOMParser(),
//             doc = parser.parseFromString(template, "text/html"),
//             styles = doc.querySelector('.wtg-toolbar-styles'),
//             scripts = doc.querySelector('.wtg-toolbar-scripts'),
//             toolbar = doc.querySelector('.js-wtg-toolbar'),
//             toolbarModal = doc.querySelector('.js-wtg-toolbar-modal');
//
//         let toolbarManifest = document.createElement('link');
//         toolbarManifest.setAttribute('href', `${extensionOrigin}/manifest.json`);
//         toolbarManifest.setAttribute('rel', 'manifest');
//
//         // document.head.appendChild(manifest);
//
//         // document.head.appendChild(styles);
//         // document.body.appendChildnt(toolbar);
//         // document.body.appendChildnt(toolbarModal);
//         // document.body.appendChildnt(scripts);
//         //
//         //
//         // console.log(styles);
//         // console.log(scripts);
//         // console.log(toolbar);
//         // console.log(toolbarModal);
//     })




const getChromeStorage = (key, closure= () => null) =>  {
    chrome.storage.sync.get([key], closure);
}

const setChromeStorage = (object, closure = () => null) => {
    chrome.storage.sync.set(object, closure);
}

const formRequest = (url, data, onSuccess) => {
    $.ajax({
        type:"POST",
        url: url,
        data: data,
        success: onSuccess
    });
}

const sendMessage = (type, text) => {
    chrome.runtime.sendMessage({
        type : type,
        text : text
    });
}


class RequestListener
{
    onAuth(query) {
        formRequest(
            "https://test.local/api/authenticate",
            {
                email: query.email,
                password: query.password
            },
            function (response) {
                if("error" !== response) {
                    let status = 'autorisated',
                        session = response,
                        email = query.email
                    setChromeStorage({session: response})
                    setChromeStorage({status: status})
                    setChromeStorage({email: email})
                    sendMessage('success','Вас авторизовано!')
                }
                if ("error" === response) {
                    sendMessage('error','Не правильний email або пароль!')
                }
            }
        )
    }
    onReg(query){
        formRequest(
            "https://test.local/api/register",
            {
                email: query.email,
                password: query.password
            },
            function (data) {
                console.log('success register')
            }
        )
    }
    onLogout(){
        formRequest(
            "https://test.local/api/logout",
            {},
            function (data) {
                let status = 'not autorisated'
                setChromeStorage({status: status})
                console.log('success logout')
            }
        )
    }
    onGetsite(){
        getChromeStorage('status', (result) => {
            if ("autorisated" === result.status) {
                getChromeStorage('session', (result) =>
                    formRequest(
                        "https://test.local/api/get_site",
                        {
                            session: result.session,
                            url: window.location.href
                        },
                        function (data) {
                            console.log('get site success')
                        }
                    )
                )
            }
        })
    }

}


chrome.runtime.onMessage.addListener(function (query){
    switch (query.type) {
        case 'auth' :
            new RequestListener().onAuth(query)
            break;

        case 'reg' :
            new RequestListener().onReg(query)
            break;

        case 'logout' :
            new RequestListener().onLogout()
            break;
    }

})

new RequestListener().onGetsite()








