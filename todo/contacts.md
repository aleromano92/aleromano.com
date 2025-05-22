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

- blank option selected as default -> before an option is selected, the rest of the form will be hidden
- problems on the website, wether it's a bug or issue with the content -> the form will hide all the input and just render a button that links to opening an issue on GitHub directly on my project, https://github.com/aleromano92/aleromano.com
- consultancy request -> prefill the Message textarea with a sentence that says "Please, in order to make good use of your time and mine, please don't contact me before reviewing at least my LinkedIn profile (https://www.linkedin.com/in/aleromano92/). If you think I could be a good help for your company, write here why you think so and leave me a link to get more details". The submit button will send those info to my personal email.
- mentoring -> prefill the Message textarea with a sentence that says "Please, in order to make good use of your time and mine, write here why you think I could be of any help and I will happily do my best to help you". The submit button will send those info to my personal email.
- job opportunities -> prefill the Message textarea with a sentence that says "please, in order to make good use of your time and mine, please don't contact me before reviewing at least my LinkedIn profile (https://www.linkedin.com/in/aleromano92/). If you think I could be a good fit for your company, write here why you think so and leave me a link to get more details". The submit button will send those info to my personal email.
- general inquiry -> will send me an email to my personal email

Since this GitHub project is public, I don't want to commit my hardcoded email address, so use an environemnt variable for it called ALE_PERSONAL_EMAIL.
I expect to define the variable in the Github Action pipeline, like I did in .github/workflows/deploy.yml.

The spirit of this project is to be back at the basics and build things from scratch: I would like NOT to use any SaaS to send email, more configuring a SMTP server with Docker in my Hetzner VPS. I expect you to provide me with the Dockerfile and the docker-compose.yml file to run the SMTP server. The SMTP server should be configured to use my personal email as the sender address.

Use in-page <style> just put it after the HTML content like the other files you could use for reference. Remember to use the CSS variables i've defined in the styles/theme.css file.
Make the layout responsive and be sure to use proper colors as I support light/dark theme.
For all the buttons, use the same styles as the 404.astro page. Export button styles to a separate file and import it in the contact.astro page and the 404 page if you think it's relevant.

Let's do this step by step and ask for my validation before proceeding to the next step.

Ask me any clarification question before implementing.

