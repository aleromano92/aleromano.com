I want to create a contact form in the current src/pages/contact.astro in order for people visiting my website to contact me.

I don't want to expose my email and actually I want to act differently based on the contact reason.

Since I'm building this website as a server side rendered app using the Node.js adapter for Asro, I expect to be able to expose some API that the contact form can call to send the data. Then this API will handle the logic of what to do with the data based on the contact reason.

In the form, the inputs should be in this order:
1. Contact reason (select)
2. Name (text)
3. Email (text)
4. Message (textarea)
5. Submit button

Here is the list of contact reasons and dedicated actions:

- problems on the website, wether it's a bug or issue with the content -> the form will render a button that links to the opening issue on GitHub directly on my project.
- consultancy request (including mentoring) -> will send me an email to my personal email 
- job opportunities -> will ask clarification questions about which kind of role and only if everything meets my skills will allow to send the offer via mail to my personal email
- general inquiry -> will send me an email to my personal email

Since this GitHub project is public, I don't want to commit my hardcoded email address, so think about using secrets in the GitHub Action.
