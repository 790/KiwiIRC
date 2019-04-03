'kiwi public';

/** @module */

/**
 * Adds the +draft/typing IRCv3 spec to irc-framework
 */
export default function typingMiddleware() {
    return function middleware(client, rawEvents, parsedEvents) {
        addFunctionsToClient(client);
        rawEvents.use(theMiddleware);
    };

    function theMiddleware(command, message, rawLine, client, next) {
        if (command !== 'TAGMSG' || !message.tags['+draft/typing']) {
            next();
            return;
        }

        client.emit('typing', {
            target: message.params[0],
            nick: message.nick,
            ident: message.ident,
            hostname: message.hostname,
            status: message.tags['+draft/typing'],
        });

        next();
    }
}

function addFunctionsToClient(client) {
    let typing = client.typing = {};
    let activeTyping = Object.create(null);

    function isEnabled() {
        return client.network.cap.isEnabled('message-tags');
    }

    typing.start = function start(target) {
        if (!isEnabled()) {
            return;
        }

        let lastSentStatus = activeTyping[target.toLowerCase()];
        if (lastSentStatus && lastSentStatus > Date.now() - 3000) {
            return;
        }

        activeTyping[target.toLowerCase()] = Date.now();

        let message = new client.Message('TAGMSG', target);
        message.tags['+draft/typing'] = 'active';
        client.raw(message);
    };

    typing.pause = function pause(target) {
        if (!isEnabled()) {
            return;
        }

        let message = new client.Message('TAGMSG', target);
        message.tags['+draft/typing'] = 'paused';
        client.raw(message);
    };

    typing.stop = function stop(target) {
        if (!isEnabled()) {
            return;
        }

        let message = new client.Message('TAGMSG', target);
        message.tags['+draft/typing'] = 'done';
        client.raw(message);

        delete activeTyping[target.toLowerCase()];
    };
}
