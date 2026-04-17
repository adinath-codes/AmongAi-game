<img width="1600" height="900" alt="Among AI banner" src="https://github.com/user-attachments/assets/2fac631c-0727-496e-b9bd-02d30ffb5830" />

## Gameplay Demo Video:
[![Among Ai Demo video](https://github.com/user-attachments/assets/eb1450b1-8038-4be7-a753-fc8124426b6e)](https://youtu.be/NgVzWHL8k5k)
[Click here to watch the video](https://www.youtube.com/playlist?list=PLFV2HOHC10xVrJwzCryOUZGJLe9rsaHpE)
## About the Game

Among AI is a 2D social deduction experiment where you play alongside fully autonomous AI bots. You play as either a crewmate trying to complete tasks or an impostor trying to eliminate everyone. The twist is that every bot has its own memory, pathfinding, and a brain powered by local Large Language Models.
<br>
<br>
It showcases the integration of local LLMs, a custom memory system for the bots, and a seamless bridge between a React frontend and a Phaser game engine.
<br>
<br>
Building this meant diving deep into complex systems. I put together a custom AI state machine, an A-star pathfinding grid, and an automated prompt engineering system that formats chat logs so the bots can argue and lie during emergency meetings.
<br>
<br>
A few other features I am really proud of:
- Fully autonomous bots that can roam, fake tasks, stalk players, and report dead bodies.
- Local LLM integration using Ollama for real-time, dynamic chat without API costs.
- A custom memory matrix where bots track suspicion levels and remember witness events.


## Download Instructions
Before playing, you need to set up the local AI engine so the bots can think.

## Download and install Ollama from ollama.com.

Open your terminal or command prompt and run these four commands to download the bot models:
```bash
ollama pull stablelm2
ollama pull gemma3
ollama pull qwen2.5:1.5b
ollama pull llama3.2:1b
```
Leave Ollama running in the background.

Windows:
1. Download the AmongAI_Windows_vX.X.X.zip file.
2. Move the file to wherever you want to keep the game on your computer.
3. Extract the zip file.
4. Run the AmongAI.exe file. That is it.

## Controls

Move: W, A, S, D or Arrow Keys
Interact / Vent: Space
Kill (Impostor only): Q
Report Body: R
Pause: Esc

## Gallery

<img width="1906" height="994" alt="Screenshot 2026-04-17 034000" src="https://github.com/user-attachments/assets/305a82a7-b6f1-4bac-89ea-5a209ad679ab" />
<img width="1919" height="969" alt="demo phtotos (3)" src="https://github.com/user-attachments/assets/331f772a-e579-4c3c-b979-94271144a0d6" />
<img width="1917" height="947" alt="demo phtotos (2)" src="https://github.com/user-attachments/assets/4b2fb606-e807-49f3-9d9f-b0cb3c224ade" />
<img width="1919" height="975" alt="demo phtotos (1)" src="https://github.com/user-attachments/assets/02ea63e5-d876-41c8-8212-e2e473b2957d" />
<img width="1919" height="891" alt="demo photos (5)" src="https://github.com/user-attachments/assets/a079ad0a-987e-4aad-950a-6d4852ac9536" />
<img width="1919" height="878" alt="demo photos (4)" src="https://github.com/user-attachments/assets/9aa3d264-e12a-4889-935f-deb7e8381718" />
<img width="1919" height="896" alt="demo photos (3)" src="https://github.com/user-attachments/assets/6834f3e4-9b02-4841-8b00-88fcab7d2288" />
<img width="1917" height="888" alt="demo photos (2)" src="https://github.com/user-attachments/assets/a77228ba-7f13-45ff-9916-0b60640ddb39" />
<img width="1919" height="882" alt="demo photos (1)" src="https://github.com/user-attachments/assets/b35c210e-db3a-43fd-a2da-d1efe297ccb9" />
<img width="1311" height="700" alt="demo phtotos (6)" src="https://github.com/user-attachments/assets/743daaa6-2e0a-46b3-884b-a47890bb4dd4" />
<img width="1919" height="890" alt="demo phtotos (5)" src="https://github.com/user-attachments/assets/3bd01649-61f3-4e1a-9179-c1d703c7a85f" />
<img width="1919" height="978" alt="demo phtotos (4)" src="https://github.com/user-attachments/assets/41547d88-7eaf-4b38-a87e-d227eb693446" />


If you read this far, thank you so much. I really hope you enjoy playing the Among Ai Demo.
