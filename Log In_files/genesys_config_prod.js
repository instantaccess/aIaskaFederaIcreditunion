//These are the configuration settings for chat
window._genesys = {
    widgets: {
        main: {
            theme: 'akusa',
            themes: {
                dark: 'cx-theme-dark',
                light: 'cx-theme-light',
                akusa: 'cx-theme-akusa',
            },
            customStylesheetID: 'genesys_akusa_styles',
            cookieOptions: {
                secure: true
            },
            //override text defaults: https://all.docs.genesys.com/WID/Current/SDK/WebChat-combined#Default_i18n_JSON
            //i18n: {
            //    "en": {
            //        "webchat": {
            //            ChatTitle: "Ugly Green"
            //        }
            //    }
            //}
        },
        webchat: {
            emojis: false,
            transport: {
                type: 'purecloud-v2-sockets',
                dataURL: 'https://api.usw2.pure.cloud',
                deploymentKey: 'e4e23ee7-b38d-4719-823b-5659e27b09f7',
                orgGuid: '444a10d5-6171-46bc-a7da-10078bb353de',
                interactionData: {
                    routing: {
                        targetType: 'QUEUE',
                        targetAddress: "MSC Chat",
                        priority: 10
                    }
                }
            }
        }
    }
};


//JSON structure of the initial chat form
var genesysChatForm_json = {
    wrapper: "<table></table>",
    inputs: [

        {
            id: "cx_webchat_form_firstname",
            name: "firstname",
            maxlength: "100",
            placeholder: "@i18n:webchat.ChatFormPlaceholderFirstName",
            label: "@i18n:webchat.ChatFormFirstName"
        },

        {
            id: "cx_webchat_form_lastname",
            name: "lastname",
            maxlength: "100",
            placeholder: "@i18n:webchat.ChatFormPlaceholderLastName",
            label: "@i18n:webchat.ChatFormLastName"
        }
    ]
}



