export default class Memory {
  sight: string[] = [];
  othersactivity: string[] = [];
  myactivity: string[] = [];
  fakeactivity: string[] = [];
  allegations: string[] = [];
  GlobalEvent: string[] = [];
  susMatrix: Record<string, number> = {};
  private getTime(): string {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  private addSus(targetName: string, amount: number) {
    if (!this.susMatrix[targetName]) this.susMatrix[targetName] = 0;
    this.susMatrix[targetName] = Math.max(
      0,
      Math.min(100, this.susMatrix[targetName] + amount),
    );
  }
  // constructor() {
  //   this.addSus('chris', 99);
  // }
  writeSight(targetName: string, isDead: boolean, location: string) {
    this.sight.push(
      `[${this.getTime()}]:${targetName} was found ${isDead ? 'DEAD' : 'ALIVE'} at ${location}`,
    );

    if (this.sight.length > 10) {
      this.sight.shift(); // keep only the recent 10 logs
    }
    if (!isDead) this.addSus(targetName, -2); // doing normal things so lowers sus
  }
  writeOthersActivity(targetName: string, task: boolean, timeSpan: string) {
    this.othersactivity.push(
      `[${this.getTime()}]:${targetName} is standing near ${task} for ${timeSpan}s`,
    );

    if (this.othersactivity.length > 10) {
      this.othersactivity.shift(); // keep only the recent 10 logs
    }
    this.addSus(targetName, 5); // following or stacking near task creates sus
  }
  writeMyActivity(action: string, location: string) {
    this.myactivity.push(
      `[${this.getTime()}]:I was in ${location} doing ${action}`,
    );
    if (this.myactivity.length > 10) {
      this.myactivity.shift(); // keep only the recent 10 logs
    }
  }
  writeFakeActivity() {
    //take random correct data from crewmates data or hallucinate or give data like below commented
    // this.fakeactivity.push(`[${this.getTime()}] I was in ${location} doing ${action}`)
    if (this.fakeactivity.length > 10) {
      this.fakeactivity.shift(); // keep only the recent 10 logs
    }
  }
  //for 100% surity
  writeAllegation(
    targetName: string,
    alligationType: 'VENTING' | 'KILLING',
    location: string,
  ) {
    this.allegations.push(
      `[${this.getTime()}]: I literally saw ${targetName} ${alligationType} in ${location}`,
    );
    if (this.allegations.length > 10) {
      this.allegations.shift(); // keep only the recent 10 logs
    }
    this.addSus(targetName, 100); //sure
  }
  //MAJOR EVENTS: such as sabotaged or meeting called
  writeGlobalEvent(eventName: string) {
    this.GlobalEvent.push(`[${this.getTime()}] ${eventName}`);
    if (this.GlobalEvent.length > 10) {
      this.GlobalEvent.shift(); // keep only the recent 10 logs
    }
  }
  writeBodyProximity(targetName: string, dist: number, maxVisionRad: number) {
    const clampedDist = Math.min(dist, maxVisionRad);
    const maxPenality = 45;
    const susPen = Math.floor((1 - clampedDist / maxPenality) * maxPenality);
    if (susPen > 0) {
      this.addSus(targetName, susPen);
    }
    this.sight.push(
      `[${this.getTime()}]: I saw ${targetName} fleeing near the reported body!`,
    );

    if (this.sight.length > 10) this.sight.shift();
  }
  getHihglySusOn() {
    const topSusPair = Object.entries(this.susMatrix).reduce((prev, curr) =>
      curr > prev ? curr : prev,
    );
    return topSusPair[1] > 60 ? topSusPair[0] : 'No one';
  }
  //EXPORTING FOR LLMs
  getImpostorData() {
    return {
      realActions: this.myactivity,
      fakeActions: this.fakeactivity,
      GlobalEvent: this.GlobalEvent,
    };
  }
  getCrewmateData() {
    return {
      myActions: this.myactivity,
      observations: [...this.sight, ...this.othersactivity],
      hardEvidence: this.allegations,
      GlobalEvent: this.GlobalEvent,
      highlySusOn: this.getHihglySusOn,
    };
  }
  //NEW VOTING SYS
  getVoteDecision(alivePlayers: string[]): string {
    let susThreshold = 30;
    let target = 'skip';
    console.warn(this.susMatrix);
    alivePlayers.forEach((player) => {
      const sus = this.susMatrix[player] || 0;
      if (sus > susThreshold) {
        susThreshold = sus;
        target = player;
      }
    });
    return target;
  }
  //MEETING BASED LLM SUS MODIFICATION
  applyMeetingBasedShift(shifts: Record<string, number>) {
    Object.entries(shifts).forEach(([player, shiftAmount]) => {
      if (typeof shiftAmount === 'number' && !isNaN(shiftAmount)) {
        this.addSus(player, shiftAmount);
      }
    });
  }
}
