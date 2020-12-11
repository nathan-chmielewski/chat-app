// Client code to connect to server using web sockets
// Using client-side socket.io.js library

// Call io(), from socket.io.js - sets up connection between client (this)
// and server set up in index.js
// io returns socket connection object
const socket = io()

// ELEMENTS
// Target element from HTML document
// Pass string name of element id
// Returns js representation of the element
// Get js representation of HTML form element
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#find-me')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

// TEMPLATES
// Mustache templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// OPTIONS
// Use query string library, returns object with key=value of query from url 
// to retrieve username, room name 
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true // Trim off '?' at beginning of query string
})

const autoscroll = () => {
    // Get new message element from messages
    const $newMessage = $messages.lastElementChild

    // Get height of $newMessage - taking margin into account, defined in css (margin bottom spacing)
    // Get message element style with global getComputedStyle method
    const newMessageStyles = getComputedStyle($newMessage)
    // Get marginBottom value and convert to int
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    // Get newMessage element height + marginBottom height
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Get visible height - space to view sent messages (represented by scroll bar)
    const visibleHeight = $messages.offsetHeight
    
    // Get height of messages container - height of all messages container
    const containerHeight = $messages.scrollHeight

    // Get how far down user has scrolled in container (bottom of scrollbar)
    // .scrollTop gives distance between top of content and top of scrollbar
    // Add scrollbar height - visible height of container
    // scrollOffset will equal distance from top of container to bottom of scrollbar/visibleHeight
    const scrollOffset = $messages.scrollTop + visibleHeight

    // Check if user was scrolled to bottom before new message was added
    if (containerHeight - newMessageHeight <= scrollOffset) {
        // Autoscroll - set scrollTop to scroll height
        $messages.scrollTop = $messages.scrollHeight
    }
    // console.log(containerHeight - newMessageHeight)
    // console.log(scrollOffset)
}

// Listen for message event from server when client connects
socket.on('message', (message) => {
    // console.log(message)
    // Render message
    // Compile template with message data to render
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// Listen for location message event from server when client sends message
socket.on('locationMessage', (locationMessage) => {
    // console.log(locationMessage)
    // Render locationMessage link
    // Compile template with message data to render - locationURL
    const html = Mustache.render(locationMessageTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})


// Add event listener on form submit - when Send button clicked
// Callback takes one arg - event
$messageForm.addEventListener('submit', (event) => {
    // Prevent default to refresh browser on submit
    // by calling preventDefault()
    event.preventDefault()
    // disable form send button
    $messageFormButton.setAttribute('disabled', 'disabled')
    // Move focus back to input
    $messageFormInput.focus()

    // Get message input from event.target - 
    // Target represents the target we are listening for the event on - the form
    // Access target(form) elements property to access inputs by name
    // const message = event.target.elements.message

    // Emit sendMessage event to server
    // Third arg - callback to run when ack received
    socket.emit('sendMessage', $messageFormInput.value, (err) => {

        // Re-enable form send button
        $messageFormButton.removeAttribute('disabled')

        if (err) {
            // return console.log(err)
            alert(err)
        } 
        // console.log('Server ack - message delivered.')
    })

    // Clear input form
    $messageFormInput.value = ''
})
 
// Add click event listener for Send location button 
// If browser supports geolocation, get position and send to server
$sendLocationButton.addEventListener('click', () => {
    if(!navigator.geolocation) {
        // status.textContent = 'Geolocation is not supported by your browser'
        return alert('Geolocation is not supported by your browser.')
    } 

    // status.textContent = 'Locating…'
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        // Emit location to server, define ack callback
        socket.emit('sendLocation', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            // console.log('Server ack - location shared.')
        })
    })
})

// Send join event to server, define ack callback
socket.emit('join', {
    username,
    room
}, (error) => {
    // If server ack sends error
    if (error) {
        alert(error)
        // Redirect to home page
        location.href = '/'
    }
})
