const { getRandomLaugh, getLaughResource } = require('./laughs');
// const { getRandomCheer, getCheerResource } = require('./cheers');
// const { getRandomBoo, getBooResource } = require('./boos');
const { Client } = require('discord.js');
const { test7 } = require('./tests/tests');
const SpeechTracker = require('./SpeechTracker/SpeechTracker');
const SoundQueue = require('./SoundQueue/SoundQueue');
const AppState = require('./AppState/AppState');
const {
	AudioPlayerStatus,
	createAudioPlayer,
	joinVoiceChannel,
} = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const { token } = require('./config/config.json');

const isArrayMatch = (arr1, arr2) => {
	if (arr1.length !== arr2.length) {
		return false;
	}

	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) {
			return false;
		}
	}

	return true;
};

const client = new Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
client.login(token);


client.once('ready', () => {
	try {
		console.log('Ready!');
	}
	catch (e) {
		console.log({ e });
	}

});

client.on('debug', console.log);

client.on('messageCreate', (message) => {
	if (message.content.length <= 1) { return; }
	const prefix = message.content[0];
	if (prefix === '!') {
		const commandInfo = message.content.substring(1).split(/\s+/);
		const command = commandInfo[0];

		if (command === 'join') {
			const laughQueue = new SoundQueue();
			const tracker = new SpeechTracker();
			const appState = new AppState();

			const channel = message.member.voice.channel;
			const connection = joinVoiceChannel({
				selfDeaf: false,
				channelId: channel.id,
				guildId: channel.guild.id,
				adapterCreator: channel.guild.voiceAdapterCreator,
			});
			appState.setCurrentChannel(channel.id);
			const receiver = connection.receiver;
			const speakAction = (isSpeaking) => {
				if (!isSpeaking) {
					laughQueue.addToQueue(setTimeout(() => {
						if (tracker.isAllUsersNotSpeaking() && !appState.isLaughPlaying) {
							const player = createAudioPlayer();
							player.on(AudioPlayerStatus.Idle, () => {
								appState.setLaughState(false);
							});

							player.on(AudioPlayerStatus.AutoPaused, () => {
								appState.setLaughState(false);
							});

							player.on(AudioPlayerStatus.Playing, () => {
								appState.setLaughState(true);
							});
							const resource = getLaughResource(getRandomLaugh());
							player.play(resource);
							connection.subscribe(player);
						}
					}, 1000));
				}
				else {
					laughQueue.clearQueue();
				}
			};
			// Get all user IDs in call
			const usersInCall = Array.from(channel.members.values());
			const userIDInCall = usersInCall.map((elem) => {
				return elem.user.id;
			});
			// Get array of receive streams
			const userStreams = userIDInCall.map((id) => {
				const newObj = receiver.subscribe(id);
				newObj.id = id;
				return newObj;
			});
			// Listen to when they start and stop
			for (const stream of userStreams) {
				stream.on('data', (chunk) => {
					const chunkString = JSON.stringify(chunk);
					const chunkObj = JSON.parse(chunkString);
					if (isArrayMatch(chunkObj.data, [248, 255, 254])) {
						tracker.emit('speak', stream.id, false, () => speakAction(false));
					}
					else {
						tracker.emit('speak', stream.id, true, () => speakAction(true));
					}
				});
			}
		}
		else if (command === 'test') {
			const laughQueue = new SoundQueue();
			const tracker = new SpeechTracker();
			const appState = new AppState();

			const channel = message.member.voice.channel;
			const connection = joinVoiceChannel({
				selfDeaf: false,
				channelId: channel.id,
				guildId: channel.guild.id,
				adapterCreator: channel.guild.voiceAdapterCreator,
			});

			const speakAction = (isSpeaking) => {
				if (!isSpeaking) {
					laughQueue.addToQueue(setTimeout(() => {
						if (tracker.isAllUsersNotSpeaking() && !appState.isLaughPlaying) {
							const player = createAudioPlayer();
							player.on(AudioPlayerStatus.Idle, () => {
								appState.setLaughState(false);
							});

							player.on(AudioPlayerStatus.AutoPaused, () => {
								appState.setLaughState(false);
							});

							player.on(AudioPlayerStatus.Playing, () => {
								appState.setLaughState(true);
							});
							const resource = getLaughResource(getRandomLaugh());
							player.play(resource);
							connection.subscribe(player);
						}
					}, 1000));
				}
				else {
					laughQueue.clearQueue();
				}
			};

			test7(tracker, speakAction);
		}
		else if (command === 'help') {
			const exampleEmbed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Command list')
				.setDescription('👋 Welcome! You can learn about all my commands in this cozy prompt.')
				.addFields(
					{ name: '!join', value: 'Joins your voice channel and automatically plays laughing, booing, and cheering sound effects.' },
					{ name: '!leave', value: 'Leaves your voice channel.' });

			message.channel.send({ embeds: [exampleEmbed] });
		}

	}
});

// client.on('voiceStateUpdate', (oldState, newState) => {
// 	const connection = getVoiceConnection(newState.guild.id);
// 	if (connection &&
// 		currentChannelID &&
// 		oldState.channelId !== currentChannelID &&
// 		newState.channelId === currentChannelID &&
// 		newState.id !== clientId && !isCheeringPlaying) {
// 		let resource = getCheerResource(getRandomCheer());
// 		const player = createAudioPlayer();
// 		player.play(resource);
// 		console.log("CHEERING");
// 		isCheeringPlaying = true;

// 		player.on(AudioPlayerStatus.AutoPaused, () => {
// 			isCheeringPlaying = false;
// 		});

// 		player.on(AudioPlayerStatus.Idle, () => {
// 			isCheeringPlaying = false;
// 		});

// 		connection.subscribe(player);
// 	} else if (connection &&
// 		currentChannelID &&
// 		oldState.channelId === currentChannelID &&
// 		newState.channelId !== currentChannelID &&
// 		newState.id !== clientId) {
// 			console.log("test");
// 			let resource = getBooResource(getRandomBoo());
// 			const player = createAudioPlayer();
// 			player.play(resource);
// 			isBooingPlaying = true;
// 			player.on(AudioPlayerStatus.AutoPaused, () => {
// 				isBooingPlaying = false;
// 			});
// 			player.on(AudioPlayerStatus.Idle, () => {
// 				isBooingPlaying = false;
// 			});
// 			connection.subscribe(player);
// 		}
// })
