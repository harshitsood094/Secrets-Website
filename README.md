# Secrets-Website

https://pure-harbor-28541.herokuapp.com/. 
In secrets website we have a choice to register using Google (OAuth) or through default register/sigin. After registering/signing in the user session can be preserved using passport JS and the user can submit an anonymous secret. 
The Secrets website has been deployed at Heroku Servers. The website uses NodeJs with Express JS at server side and HTML and EJS at client side. The data (Secrets) are stored in MongoDB servers which are hosted in AWS servers using MongoDB Atlas. The website uses passport JS for OAuth authentication using Google and creating and ending user sessions. For default login passport local along with Bcrypt Js packages are used.
