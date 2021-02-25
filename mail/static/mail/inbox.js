//CS50 Mail Project - Author: Luis Balladares


document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
 

  // By default, load the inbox
  load_mailbox('inbox');

  //Post email via fetch and redirect to Sent
  
  var composeForm = document.getElementById('compose-form')
  composeForm.addEventListener('submit', function (mailSend) {
  mailSend.preventDefault();
  
  var mailRecipients = document.getElementById('compose-recipients').value
  var mailSubject = document.getElementById('compose-subject').value
  var mailBody = document.getElementById('compose-body').value
   
  fetch('emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: mailRecipients,
      subject: mailSubject,
      body: mailBody
    }),
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    }
  }).then(function(response){return response.json()})
  .then(function(data){console.log(data)})
  .then( () => {
    load_mailbox('sent');
  });

  });

});



function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-body').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

//Archive/unarchive a particular email

function archive_email(email_id) {

  fetch(`emails/${email_id}`)
  .then(response => response.json())
  .then(my_email => {
    if(my_email.archived) {

      fetch(`emails/${my_email.id}`, {//unarchive
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      }).then( () => {
        load_mailbox('inbox');
      });
      
    } else {

      fetch(`emails/${my_email.id}`, {//archive
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      }).then( () => {
        load_mailbox('inbox');
      });

    }
  })

}

//Reply to an email

function reply_email(email_id) {

  fetch(`emails/${email_id}`)
  .then(response => response.json())
  .then(mailData => {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#emails-body').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    //Pre-fill data
    document.querySelector('#compose-recipients').value = `${mailData.sender}`;
    if (mailData.subject.slice(0, 3) == 'Re:'){
      document.querySelector('#compose-subject').value = `${mailData.subject}`; 
    } else {
      document.querySelector('#compose-subject').value = `Re: ${mailData.subject}`; 
    };
       
    document.querySelector('#compose-body').value = 
    `On ${mailData.timestamp}, ${mailData.sender} wrote:
      ${mailData.body}`; 

  });

}

//View a particular email

function view_email(email_id) {
  
  document.getElementById('emails-body').innerHTML = '';

  fetch(`emails/${email_id}`)//Get email data and display it
      .then(response => response.json())
      .then(my_email => { 
        console.log(my_email);
        checkTitle = document.getElementById('emails-view').innerHTML;//retrieve title to check in .then later
        document.getElementById('emails-view').innerHTML = `<h3 style="font-style: italic;">${my_email.subject}</h3>`;

        function mailGenerator(text, data) {//Create each div element
          viewElement = document.createElement('div');
          viewElement.classList.add('viewEmaildiv');
          document.getElementById('emails-body').append(viewElement);
          viewElement.innerHTML = `<strong>${text}</strong> ${data}`;
        }

        mailGenerator('From: ', my_email.sender);
        mailGenerator('Recipients: ', my_email.recipients);
        mailGenerator('Date: ', my_email.timestamp);
        mailGenerator('', my_email.body);

        //Add buttons if mailbox is inbox

        if(checkTitle.includes('Inbox') ){
          replybutton = document.createElement('button');
          replybutton.innerHTML = 'Reply';
          replybutton.setAttribute('class', 'btn btn-sm btn-success');
          replybutton.style.margin = '5px';
      
          archivebutton = document.createElement('button');
          archivebutton.innerHTML = 'Archive';
          archivebutton.setAttribute('class', 'btn btn-sm btn-warning');
          document.getElementById('emails-body').append(replybutton, archivebutton);

          archivebutton.addEventListener('click', function() {//on click go to arch func
            console.log('Redirecting to archive function');
            archive_email(my_email.id);

          });

          replybutton.addEventListener('click', function() {//on click go to reply
            console.log('Redirecting to reply');
            reply_email(my_email.id);

          });

        }
        
        //Add unarchive button for Archived mailbox
        if (checkTitle.includes('Archive')) {

          unarchivebutton = document.createElement('button');
          unarchivebutton.innerHTML = 'Unarchive';
          unarchivebutton.setAttribute('class', 'btn btn-sm btn-warning');
          unarchivebutton.style.margin = '5px';
          document.getElementById('emails-body').append(unarchivebutton);

          unarchivebutton.addEventListener('click', function() {//on click go to arch func
            console.log('Redirecting to archive function');
            archive_email(my_email.id);

          });

        }

      });

  fetch(`emails/${email_id}`, {//Mark as read
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });
 
}

//Load each mailbox
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#emails-body').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = 
  `<h3 class="mailboxtitle">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;  
  
  //Load appropiate mailbox
  switch(mailbox){

    case 'inbox':
      document.getElementById('emails-body').innerHTML = '';//Clears div - quick but sub-optimal?     

      fetch('emails/inbox')//Get mailbox data and display it
      .then(response => response.json())
      .then(emails => { 
        console.log(emails);

        if (!emails.length ){
          document.getElementById('emails-body').innerHTML = "<h4>You haven't received any emails yet.</h4>"
        } else {

          //Stores number of unread emails
          var unread = 0;

          emails.forEach(mail => {
            console.log(mail.id, mail.timestamp);

            inboxElement = document.createElement('div');//Display as read/unread
            if(!mail.read){
              inboxElement.classList.add('inboxdivUnread');
              unread += 1;//Count # of unread emails
            } else {
              inboxElement.classList.add('inboxdivRead');
            };
            
            document.getElementById('emails-body').append(inboxElement);
            inboxElement.innerHTML = `<div><strong>${mail.sender}</strong> &emsp;
             ${mail.subject}</div> 
              <div> ${mail.timestamp}</div> `;

            inboxElement.addEventListener('click', function() {//on click go to that email
              console.log('Redirecting to view email');
              view_email(mail.id);

            });


          });

          if (unread){//Shows unread alert, if any
            document.getElementById('emails-view').innerHTML = 
            `<h3 class ="mailboxtitle">Inbox (${unread} unread emails)</h3>`;
          }

        }
      
      });
  
      break;

    case 'sent':
      document.getElementById('emails-body').innerHTML = '';

      fetch('emails/sent')//Get mailbox data and display it
      .then(response => response.json())
      .then(emails => { 
        console.log(emails);

        if (!emails.length ){
          document.getElementById('emails-body').innerHTML = "<h4>You haven't send any emails yet.</h4>"
        } else {

            emails.forEach(mail => {
              console.log(mail.id, mail.timestamp);
      
              inboxElement = document.createElement('div');
              inboxElement.classList.add('inboxdivRead');
              document.getElementById('emails-body').append(inboxElement);
              inboxElement.innerHTML = `<div><strong>${mail.recipients}</strong>
                &emsp; ${mail.subject}</div> 
                <div> ${mail.timestamp}</div> `;

              inboxElement.addEventListener('click', function() {
                console.log('Redirecting to view mail');
                view_email(mail.id);
  
              });

            });

        }
      
        });
      
      break;
      
    case 'archive':
      document.getElementById('emails-body').innerHTML = '';

      fetch('emails/archive')//Get mailbox data and display it
      .then(response => response.json())
      .then(emails => { 
        console.log(emails);
        //aqui hacer algo con la data

        if (!emails.length ){
          document.getElementById('emails-body').innerHTML = "<h4>You don't have any archived emails.</h4>"
        } else {

          emails.forEach(mail => {
            console.log(mail.id, mail.timestamp);
            inboxElement = document.createElement('div');
            inboxElement.classList.add('inboxdivRead');
            document.getElementById('emails-body').append(inboxElement);
            inboxElement.innerHTML = `<div><strong>Recipients:</strong> ${mail.recipients}</div>
            <div><strong>Subject:</strong> ${mail.subject}</div> 
            <div><strong>Date:</strong> ${mail.timestamp}</div> `;
  
            inboxElement.addEventListener('click', function() {//on click go to that email
              console.log('Redirecting to view email');
              view_email(mail.id);

            });


          });

        }
      
        });
      
      
      break;

    default:
      document.getElementById('emails-body').innerHTML = '';

  };
  
}