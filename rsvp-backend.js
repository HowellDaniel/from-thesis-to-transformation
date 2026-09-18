// Replace this URL after deployment on Render.
const RSVP_API_URL = 'https://your-render-service-name.onrender.com/api/rsvp';

var form = document.getElementById('rsvpForm');
form.addEventListener('submit', function(e){
  e.preventDefault();
  if (!form.reportValidity()) return;

  var name = document.getElementById('name').value.trim();
  var email = document.getElementById('email').value.trim();
  var seats = document.getElementById('seats').value;

  var button = form.querySelector('button[type="submit"]');
  var originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Sending...';

  fetch(RSVP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      name: name,
      email: email,
      seats: seats,
      source: 'website'
    })
  })
    .then(function(response){
      return response.json().then(function(data){
        if (!response.ok) {
          throw new Error(data.error || 'Unable to submit RSVP.');
        }
        return data;
      });
    })
    .then(function(){
      document.getElementById('successTitle').textContent = 'You’re on the list, ' + (name.split(' ')[0] || 'friend') + '!';
      document.getElementById('successMsg').textContent = seats + (seats === '1' ? ' seat is' : ' seats are') + ' reserved — see you at AH Hotel, Friday 27th November 2026, 5:00 PM.';
      form.classList.add('done');
    })
    .catch(function(error){
      console.error(error);
      document.getElementById('successTitle').textContent = 'Thanks, ' + (name.split(' ')[0] || 'friend') + '!';
      document.getElementById('successMsg').textContent = 'Your reservation was received locally, but the email notification could not be sent. Please contact the organiser directly if needed.';
      form.classList.add('done');
    })
    .finally(function(){
      button.disabled = false;
      button.textContent = originalText;
    });
});
