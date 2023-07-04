

$(document).ready(function () {
 
  var socket = io();
  var myPeer = new Peer();

  let presentName;
  let userName;
  socket.on('existName', (names) => {
    presentName = names

    console.log(presentName)
  })

  document.querySelector('#form_').addEventListener('submit', function (e) {
    e.preventDefault()
    userName = document.getElementById('formId1').value;




    if (userName.length > 2 && !presentName.includes(userName)) {

      socket.emit('userName', userName)
      $('.Cuser').text(`${userName}`)
      $('.login-forms').hide()
      $('.chat_page').show()
      return
    }
    {
      (userName.length <= 2 && alert('name must be greater than 2 character!')) ||
        (presentName.includes(userName) && alert('this name is already exist,try another'))
    }







  })
  socket.on('typing', () => {
    $('#chat_msg').attr('placeholder', 'User is typing....');
  })
  socket.on('notyping', () => {
    $('#chat_msg').attr('placeholder', 'Send message..');
  })

  socket.on('namescollection', (names) => {

    olineUser(names = names.filter(name => name !== userName))

  })
  $("#chat_scene").on('submit', function (e) {
    e.preventDefault()
    if ($('.header-contact').text()) {

      if ($('#chat_msg').val()) {
        socket.emit('notyping', $('.header-contact').text())
        socket.emit('chat_msg', $('#chat_msg').val(), $('.header-contact').text(), userName)
        $('<li/>', {
          class: 'list-group-item  d-flex sender justify-content-between align-items-center',
          text: $('#chat_msg').val(),

          appendTo: $('.messages')
        })
        $('<br/>', {
          appendTo: $('.messages')
        })
        $('#chat_msg').val('')



      }

      else if (document.getElementById('browse').value) {

        let files = document.getElementById('browse').files[0];
        $('<li/>', {
          class: 'list-group-item  d-flex sender justify-content-between align-items-center',
          text: files.name,

          appendTo: $('.messages')
        })
        $('<br/>', {
          appendTo: $('.messages')
        })
        let reader = new FileReader()
        reader.onload = (e) => {
          let buffer = new Uint8Array(reader.result)
          console.log('buffering..')
          myfiles({ FilesSize: buffer.length, fileName: files.name }, buffer, $('.header-contact').text())

        }
        reader.readAsArrayBuffer(files)
        document.getElementById('browse').value = null
      }
    }





  })
  $('.videochat').click(function () {
    if ($('.header-contact').text()) {


      navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.webkitGetUserMedia;
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        }).then(stream => {

          socket.on('no_access', () => {

            let myVid = confirm('user-haven\'t acess any camera device,Tap ok to share your camera!')
            if (myVid === true) {
              socket.emit('getStream', myPeer.id, $('.header-contact').text(), userName)
            }
            else {
              return
            }

          })

          socket.emit('user-connected', myPeer.id, $('.header-contact').text(), userName);
          myPeer.on('call', call => {
            call.answer(stream)
            const video = document.createElement('video')
            video.muted = true
            video.autoplay = true
            video.volume = 0;
            video.srcObject = stream
            video.className = 'myVid'
            document.body.append(video)


            call.on('stream', (userStream) => {
              addVideoStream(userStream)
            })

          })




        }).catch(console.log('err-----------getUserMedia-----------------'))
      }

    }

  })



  function addVideoStream(stream) {
    const existBtn = document.createElement('button')
    existBtn.className = 'existBtn';
    existBtn.innerHTML = '\ue225';
    existBtn.addEventListener('click', () => {
      existBtn.remove()
      $('#video-grid video').remove()
      $('#video-grid').hide()
      $('video').remove()

    })
    document.body.append(existBtn)
    const videoGrid = document.getElementById('video-grid');
    videoGrid.style.display = 'block';
    const video = document.createElement('video')

    video.srcObject = stream;
    video.autoplay = true


    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGrid.appendChild(video);
  }

  function myfiles(metadata, buff, receiver) {
    console.log('mifile happen')
    socket.emit('metadata', metadata, receiver)

    let chunks = 1024
    let intChunks = 0;
    while (intChunks < metadata.FilesSize) {
      socket.emit('chunks', buff.slice(intChunks, intChunks + chunks), receiver)
      intChunks += chunks
    }
  }

  let Newdata = {
    metadata: null,
    arrChunks: []
  }

  socket.on('newmetadata', data => {
    console.log('on loaded metadata')
    Newdata.metadata = data
    Newdata.arrChunks = []
  })
  socket.on('newchunks', (chunks) => {
    console.log('chunking..')
    Newdata.arrChunks.push(chunks)
    if ((Newdata.metadata.FilesSize / 1024) <= Newdata.arrChunks.length) {
      let blob = new Blob(Newdata.arrChunks)
      download(blob, Newdata.metadata.fileName)
    }

  })
  $('.screen-share').click(function () {
    if ($('.header-contact').text()) {
      console.log('screen share--')
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(function (stream) {
        addVideoStream(stream)
        socket.emit('getStream', myPeer.id, $('.header-contact').text(), userName)
        myPeer.on('call', (call) => {
          call.answer(stream)
          const video = document.createElement('video')
          video.muted = true
          video.autoplay = true
          video.volume = 0;
          video.srcObject = stream
          video.className = 'myScreen'
          document.body.append(video)


          call.on('stream', (userStream) => {
            addVideoStream(userStream)
          })
        }
        )

      })

    }

  })
  function download(blobs, name) {
    console.log(blobs)
    let link = document.createElement('a')
    link.download = name
    link.href = URL.createObjectURL(blobs)
    link.textContent = '\u21E9'
    let image = document.createElement('img')
    image.src = URL.createObjectURL(blobs) || URL.createObjectURL(blobs).replace(/blob:/, '')

    console.log(image.src)
    image.className = 'fileImg';


    image.addEventListener('load', () => {
      URL.revokeObjectURL(image.src)
    })
    $('<li/>', {
      class: 'list-group-item  d-flex receiver justify-content-between align-items-center',


      click: function () {
        console.log('click')
        link.click()
      },
      append: image,
      appendTo: $('.messages')
    })
    $('<br/>', {
      appendTo: $('.messages')
    })



  }
  $("#chat_scene").on('submit', function (e) {
    e.preventDefault()
  })
  socket.on('chat_message', (msg, sender) => {
    $('<li/>', {
      class: 'list-group-item  d-flex receiver justify-content-between align-items-center',
      text: sender + ':  ' + msg,
      css: 'position:absolute;top:0px;width:200px;overflow:scroll;float:right;margin-top:100px;background:teal',
      appendTo: $('.messages')
    })
    $('<br/>', {
      appendTo: $('.messages')
    })
  })
  $('#invite').click(function () {
    alert('share this link to invite\nhttps://www.CompanionNet.onrender.com')
  })

  $('#searchbox').on('input', function () {

    presentName = presentName.filter(name => {
      return name !== userName
    })
    console.log(($(this).val().length), presentName)
    let searchedResult = presentName.filter(name => {


      return name.substring(0, ($(this).val().length)) == $(this).val()


    })
    console.log(searchedResult)
    olineUser(searchedResult)
  })

  function olineUser(names) {

    if (names.length) {

      $('.list-group li').remove()
      let i = 0
      while (i < names.length) {
        console.log(i)
        $('<li/>', {
          class: 'list-group-item d-flex justify-content-between align-items-center',
          text: names[i],
          id: i,


          click: function () {

            $('#chat_msg').on('input', function () {
              if ($(this).val()) {

                socket.emit('typing', $('.header-contact').text())
              }
              else if ($(this).val().length === 0) {
                socket.emit('notyping', $('.header-contact').text())
              }
            })





            $('.header-contact').text($(`#${this.id}`).text())






            $('.chat-platform').click()
          },

          appendTo: $('.list-group')

        })
        i++
      }
    }
    else {
      $('.list-group li').remove()
    }


  }
  function emptyStream(width, height) {
    let canv = Object.assign(document.createElement('canvas'), { width, height })
    canv.getContext('2d').fillRect(0, 0, width, height)
    let media = canv.captureStream()
    let track = media.getVideoTracks()[0]
    return Object.assign(track, { enabled: false })
  }
  socket.on('takeStream', (id) => {

    let stream = new MediaStream([emptyStream(0, 0)]);
    let call = myPeer.call(id, stream)

    call.on('stream', streamUser => {
      addVideoStream(streamUser)
    })

  })
  socket.on('user-connected', (userId, sender) => {
    navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia || navigator.mediaDevices.mozGetUserMedia || navigator.mediaDevices.webkitGetUserMedia;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      let call = myPeer.call(userId, stream)
      let video = document.createElement('video')
      video.muted = true
      video.autoplay = true
      video.volume = 0;
      video.className = 'myVid'


      video.srcObject = stream
      document.body.append(video)
      call.on('stream', streamUser => {
        addVideoStream(streamUser)

      })


    }).catch(() => {

      socket.emit('userCam', sender)
      return
    })


  })




});