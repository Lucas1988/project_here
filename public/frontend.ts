import * as sdk from "microsoft-cognitiveservices-speech-sdk";


// This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
const speechConfig = sdk.SpeechConfig.fromSubscription('XXXX, 'XXXX');
speechConfig.speechRecognitionLanguage = "en-US";

// @ts-ignore
async function main(onProgress) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
    let audioConfig = sdk.AudioConfig.fromStreamInput(stream);
    let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    let username = 'Son';
    let conversation_log = ''
    let conversation_turn = 1;
    while (true) {
        let completion_text = ""
        let completion_emotion = ""
        let completion_name = ""
        let voice = ""

        onProgress({turn: 'user'})
        console.log("\n--- user ---");
        const result = await new Promise(resolve => speechRecognizer.recognizeOnceAsync(resolve))
        // @ts-ignore
        if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
            console.log("error")
            continue
        }
        // @ts-ignore
        const input_text = result.text
        console.log(`input:`, input_text);
        if(input_text != ''){
            conversation_log += `\n${username}: ${input_text}\nDad:`;
        }

        onProgress({turn: 'ai_thinking'});

        // Pass text to GPT-3
        const response = await fetch('/api/completion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                conversation_log
            })
        })
        const { completion } = await response.json();
        console.log(completion);

        try {
            // @ts-ignore
            completion_text = completion.split("\n")[0].trim();
            completion_emotion = "hopeful";
            completion_name = "dad";
        } catch(e){
            console.log('Something went wrong:', e);
            continue;
        }

        voice = 'en-US-SaraNeural';

        conversation_log += completion;
        console.log("completion:", completion_text);


        onProgress({turn: 'ai'})
        const audioConfigOut = sdk.AudioConfig.fromSpeakerOutput();
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfigOut);
        let ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
                <voice name="${voice}">
                    <mstts:express-as style="${completion_emotion}">
                        ${completion_text}
                    </mstts:express-as>
                </voice>
            </speak>
        `.trim();

        await new Promise(resolve => synthesizer.speakSsmlAsync(ssml, async result => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                // @ts-ignore
                await new Promise(resolve => setTimeout(resolve, result.privAudioDuration / 10000));
                // @ts-ignore
                resolve();
            }
        }));
        synthesizer.close()

        console.log(`audio done`);
        conversation_turn += 1;
    }

}
// @ts-ignore
main(data => {
    document.querySelectorAll(`.user .active-outline, .user .active-logo`)
    // @ts-ignore
        .forEach(node => node.style.display = data.turn === "user" ? "block" : "none")
    document.querySelectorAll(`.ai-user .active-outline, .ai-user .active-logo`)
    // @ts-ignore
        .forEach(node => node.style.display = data.turn === "ai" ? "block" : "none")
});

