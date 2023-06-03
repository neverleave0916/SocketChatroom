const express = require('express');
const session = require('express-session')
const UserStore = require('./userStore');

const app = express();
const sessionMiddleware = session({
    secret: "7n4EQCT6NJvSQRHFIZNEGqz3iPCYmP2b",
    resave: true,
    saveUninitialized: true
});


const server = require('http').Server(app);
const io = require('socket.io')(server);
io.engine.use(sessionMiddleware);
const userStore = new UserStore();

// 修改這一部分
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});


let ramdom_words = []
async function generateUsername() {
    try {
      if (ramdom_words.length === 0) {
        const maxLength = 6; // Maximum length of each word
        const response = await fetch(`https://random-word-api.herokuapp.com/word?number=20&length=${maxLength}`);
        if (!response.ok) {
          throw new Error('Failed to fetch random words');
        }
        const data = await response.json();
        ramdom_words = data;
      }
  
      const randomIndex = Math.floor(Math.random() * ramdom_words.length);
      let randomWord = ramdom_words[randomIndex];
      randomWord = randomWord.charAt(0).toUpperCase() + randomWord.slice(1);
      ramdom_words.splice(randomIndex, 1);
  
      return randomWord;
    } catch (error) {
      console.error(error);
      return 'username_error';
    }
  }


io.on('connection', async (socket) => {
    const req = socket.request;

    socket.use((__, next) => {
        req.session.reload((err) => {
            if (err) {
                console.log(err);
                socket.disconnect();
            } else {
                next();
            }
        });
    });

    
    if (req.session.randomUsername) {
        // console.log("user already has a username")
        socket.emit('randomUsername', req.session.randomUsername);
        socket.username = req.session.randomUsername;
        userStore.addUser(socket.id, req.session.randomUsername);

    } else {
        await generateUsername()
            .then((randomUsername) => {
                socket.emit('randomUsername', randomUsername);
                socket.username = randomUsername;
                userStore.addUser(socket.id, randomUsername);
                req.session.randomUsername = randomUsername;
                req.session.save();
            })
            .catch((error) => console.error(error));
    }
    console.log(`User ${socket.username} connected. ID: ${socket.id}`);

    io.emit('getAllUsers', userStore.getAllUsers());
    // 發送人數給網頁
    io.emit("online", userStore.getOnlineUsersCount());

    socket.on("send", (msg) => {
        // 廣播訊息到聊天室
        io.emit("msg", msg);
    });

    socket.on('disconnect', () => {
        // 取得該名斷線使用者的 username
        const disconnectedUsername = socket.username;

        // 從使用者列表中移除該名使用者(如果還有其他連線，則該名使用者仍會是上線狀態)
        userStore.removeUser(socket.id);

        // 發送上線人數給網頁
        io.emit("online", userStore.getOnlineUsersCount());

        // 發送使用者列表給網頁
        io.emit('getAllUsers', userStore.getAllUsers());

        console.log(`User ${disconnectedUsername} disconnected. ID: ${socket.id}`);

    });
});


server.listen(3000, () => {
    console.log("Server Started. http://localhost:3000");
});