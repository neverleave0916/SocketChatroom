class UserStore {
    constructor() {
        this.connectedUsers = {};
    }

    addUser(socketId, username) {
        if (!this.connectedUsers[username]) {
            this.connectedUsers[username] = {
                sockets: new Set([socketId]),
                connected: true,
            };
        } else {
            this.connectedUsers[username].sockets.add(socketId);
            this.updateUserStatus(username, true);
        }
    }

    removeUser(socketId) {
        for (const username in this.connectedUsers) {
          const { sockets } = this.connectedUsers[username];
          if (sockets.has(socketId)) {
            sockets.delete(socketId);
            if (sockets.size === 0) {
              this.updateUserStatus(username, false);
            }
            break;
          }
        }
      }

    updateUserStatus(username, connected) {
        if (this.connectedUsers[username]) {
            this.connectedUsers[username].connected = connected;
        }
    }
    // updateUserStatus(socketId, connected) {
    //     for (const username in this.connectedUsers) {
    //         const { sockets } = this.connectedUsers[username];
    //         if (sockets.has(socketId)) {
    //             this.connectedUsers[username].connected = connected;
    //             break;
    //         }
    //     }
    // }

    getUserStatus(username) {
        if (this.connectedUsers[username]) {
            return this.connectedUsers[username].connected ? 'Connected' : 'Disconnected';
        }
        return 'Disconnected';
    }

    getAllUsers() {
        const users = [];
        for (const username in this.connectedUsers) {
            const status = this.getUserStatus(username);
            users.push({ username, status });
        }
        return users;
    }

    getOnlineUsersCount() {
        const users = [];
        for (const username in this.connectedUsers) {
            const status = this.getUserStatus(username);
            if(status === 'Connected'){
                users.push(username);
            }
            
        }
        return users.length;
        // return Object.keys(this.connectedUsers).length;
    }
}

module.exports = UserStore;
