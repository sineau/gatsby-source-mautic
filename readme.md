# Mautic form plugins
This plugins fetches forms from Mautic.

## Setup
There are two options available to authenticate your app:
    - Basic Authentication (recommended for most cases),
    - Oauth2 (although I coudn't come up with a scenario, I added it just in case)

for basic authentication all you need to do is to provide following option in your `gatsby-config.js`:

```
{
    resolve: 'gatsby-source-mautic',
    options: {
        baseUrl: [URL of your mautic installation],
        auth: 'basic', [optional]
        publicKey: [your username],
        secretKey: [your password]
    }
}
```

sample config for oauth2:
```
{
    resolve: 'gatsby-source-mautic',
    options: {
        baseUrl: [URL of your mautic installation],
        auth: 'oauth2', [required]
        publicKey: [Fetch this from Mautic's API authentication],
        secretKey: [same as above],
        state: [some random number],
        redirectUri: [this should match with the one you provided to mautic]
    }
}
```
note that you need extra setup in your server config, if you want to authenticating your app on your server. You can, however, authenticate your app on your local machine and move token.json to your server.

## GraphQL Output
The plugin fetches all form properties from Mautic API (see [Mautic Developer Documentation](https://developer.mautic.org/#forms189)). You can see a sample Query below. Note that to get a form field, you need to use `formFields`. Other than this, all property keys are identical to those in Mautic documentation.
```
{
  allMauticForm {
    edges {
      node {
        id
        actions {
          id
          properties {
            subject
          }
        }
        formFields {
          id
          type
          leadField
        }
      }
    }
  }
}
```

