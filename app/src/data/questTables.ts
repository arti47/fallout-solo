// Quest generation — complete from Chapter 6 (pg.146-147) and Appendix 2
// (pg.194-216): Rewards, the 18 Goal Types with every Goal and its narrative
// prompt questions, the Main Quest Blocker table (pg.74-75), and the
// Clear Blocker table (pg.158).

const roll = (max: number) => Math.floor(Math.random() * max) + 1;

// ===================== SIDE QUEST REWARDS (pg.194-196) =====================
export interface QuestReward {
  range: [number, number];
  name: string;
  description: string;
}

export const QUEST_REWARDS: QuestReward[] = [
  { range: [1, 10], name: 'Mystery', description: 'The NPC is unable to confirm what they can offer you, or the outcome of the quest itself is unknown. When gaining this reward, roll again on this table, but add +10 to your result.' },
  { range: [11, 11], name: 'Caps', description: 'A Stack of Caps.' },
  { range: [12, 12], name: 'More Caps', description: 'Two Stacks of Caps.' },
  { range: [13, 13], name: 'Even More Caps', description: 'Three Stacks of Caps.' },
  { range: [14, 14], name: 'Ranged Weapon', description: 'Generate two [CONDITION] [RANGED WEAPONS] and pick one as a Reward.' },
  { range: [15, 15], name: 'Melee Weapon', description: 'Generate two [CONDITION] [MELEE WEAPONS] and pick one as a Reward.' },
  { range: [16, 16], name: 'Chems', description: 'A [QUANTITY] of [CHEMS].' },
  { range: [17, 17], name: 'Supplies', description: 'A [QUANTITY] of [SUPPLIES].' },
  { range: [18, 18], name: 'Training', description: 'When gaining XP for this Quest, gain an additional XP.' },
  { range: [19, 19], name: 'Armor', description: 'Generate two [CONDITION] [ARMOR] and pick one as a Reward.' },
  { range: [20, 20], name: 'A Favour', description: 'Increase your Reputation by one Step with a Settlement linked to the Quest. If you are already Allied to that Settlement, re-roll your result and add 10 to it.' },
  { range: [21, 21], name: 'A Pact', description: 'Increase your Reputation by two Steps with a Settlement linked to the Quest. If you are already Allied to that Settlement, re-roll your result and add 10 to it.' },
  { range: [22, 22], name: 'Nothing…', description: 'When you go to gain your reward, the NPC has vanished (or you find an ammo crate with an insulting note in it)! Gain a new Quest with the goal of hunting them down.' },
  { range: [23, 23], name: 'Fortune', description: 'Five Stacks of Caps.' },
  { range: [24, 24], name: 'Pristine Armor', description: 'A Pristine set of [ARMOR].' },
  { range: [25, 25], name: 'Information', description: 'Immediately generate any adjacent unexplored Locations as if you had just Travelled to them.' },
  { range: [26, 26], name: 'Modifications', description: 'Apply a [MODIFICATION] to any Weapon or Armor you choose. If you do not have an item you want modified at this time, you may return here at a later time with an item and have it modified then.' },
  { range: [27, 27], name: 'A Backpack full of Chems', description: 'A seemingly unlimited quantity of [CHEMS].' },
  { range: [28, 28], name: 'Quality Weaponry', description: 'A Pristine [RANGED WEAPON] or [MELEE WEAPON].' },
  { range: [29, 29], name: 'Power Armor', description: 'A [CONDITION] set of Power Armor.' },
  { range: [30, 99], name: 'Blocker Bypass', description: 'You gain some method of clearing the Blocker from your Main Quest.' }
];

const fromRange = <T extends { range: [number, number] }>(table: T[], r: number): T =>
  table.find(e => r >= e.range[0] && r <= e.range[1]) ?? table[table.length - 1];

/** Rolls the Reward table, resolving the Mystery re-roll (+10) automatically. */
export const rollQuestReward = (): QuestReward => {
  const r = roll(20);
  const result = fromRange(QUEST_REWARDS, r);
  if (result.name === 'Mystery') {
    return fromRange(QUEST_REWARDS, roll(20) + 10);
  }
  return result;
};

// ===================== GOAL TYPES & GOALS (pg.196-216) =====================
export interface SideQuestGoal {
  range: [number, number];
  goal: string;
  questions: string;
}

export interface GoalType {
  name: string;
  flavor: string;
  goals: SideQuestGoal[];
}

export const GOAL_TYPES: GoalType[] = [
  {
    name: 'Vengeance',
    flavor: 'Whoever gave you this Quest is angry. Angry enough to need payback.',
    goals: [
      { range: [1, 2], goal: 'Something important was stolen from me. I want it back.', questions: 'What was it, and why is it important?' },
      { range: [3, 4], goal: 'Someone I cared about was killed. I want to get justice on the killer myself.', questions: 'Who was killed, and was it someone you also know?' },
      { range: [5, 6], goal: 'The person I wanted vengeance against is long dead. They buried a fortune; it should be mine.', questions: "Why haven't they retrieved the treasure already?" },
      { range: [7, 8], goal: 'Someone showed me up. I want them humiliated.', questions: 'Who are they? How would they be humiliated?' },
      { range: [9, 10], goal: 'I was ousted from my old [FACTION] by my rival. I took the fall for something they did. If I could prove it wasn\'t me, I could settle the score.', questions: 'What were they accused of? What evidence would prove their innocence?' },
      { range: [11, 12], goal: "Arguments with my rival keep on escalating. I'm worried about what they will do next.", questions: 'What started the feud? What was the last retaliation they made?' },
      { range: [13, 14], goal: 'My home was taken from me, and the ones who took it from me still live there. I want them gone.', questions: 'Who took their home?' },
      { range: [15, 16], goal: "I need you to deliver this package. Trust me, you don't want to open it.", questions: 'Who are you delivering the package to? Do you know what will happen after it is delivered?' },
      { range: [17, 18], goal: "I've uncovered secrets to ruin my enemy's life. Now I just need them spread.", questions: "Spill the beans, what's the secret? Whose life are we ruining?" },
      { range: [19, 20], goal: "I'll pay good caps to know the whereabouts of my rival along with their schedule. And don't let anyone catch you.", questions: 'Who am I tailing? Do I know what the quest giver will do with the information?' }
    ]
  },
  {
    name: 'Money',
    flavor: "There's only one thing that matters these days, Caps. Cold, hard, Caps.",
    goals: [
      { range: [1, 2], goal: 'I want to purchase goods to sell at a profit, I just need a go-between.', questions: 'Why are the goods so cheap, or why are they so needed? Why do they not get the goods themselves?' },
      { range: [3, 4], goal: 'I give small loans to needy Wasters. An [NPC]\'s payments are late. I need to be repaid.', questions: "Why haven't they handled it themselves? What [QUANTITY] of cap stacks do they owe?" },
      { range: [5, 6], goal: "I've got a brilliant idea that will make us both rich!", questions: "Why is it a bad idea? Do you know it's a bad idea?" },
      { range: [7, 8], goal: 'Could you convince my business partner to cough up some caps? Our new venture needs capital or it will fail.', questions: "What's the business? Why is it failing?" },
      { range: [9, 10], goal: 'I owe more than I can pay to debtors. I need caps, and quickly.', questions: 'How are they going to raise those funds (roll again on this table, or come up with a desperate idea)?' },
      { range: [11, 12], goal: "I've always dreamed of becoming a trader, but I need help getting started.", questions: 'What would they trade? What stopped them until now?' },
      { range: [13, 14], goal: 'I locked away most of my caps in a secure location. Could you help me get them back?', questions: "Why can't they get them themselves? How were they secured?" },
      { range: [15, 16], goal: "I've got assets I need to transport. I need someone to protect them.", questions: 'What makes the assets special? Why do they need special protection?' },
      { range: [17, 18], goal: "I need help robbing an [NPC]. I'll gladly share the spoils.", questions: 'What skills do I provide? What provides the reason or opportunity?' },
      { range: [19, 20], goal: "A [RAIDER] gang has heard about my assets. I've heard they are sending people to take them.", questions: 'What are they trying to steal, specifically? Why is the quest giver attached to the item?' }
    ]
  },
  {
    name: 'Family',
    flavor: "Family is the root of everything; without it, we're nothing, so we should do all we can to keep it.",
    goals: [
      { range: [1, 2], goal: 'My family is in danger, we need to disappear.', questions: 'What is the supposed danger? Where do they want to start their new life?' },
      { range: [3, 4], goal: "My sister didn't show up to our yearly family meeting. I want to know why.", questions: 'What is the sister like? Where did she come from?' },
      { range: [5, 6], goal: "I've always wanted to start a family; I've just never been able to find the right person.", questions: 'Do they have a crush on someone already? What stops them from making relationships?' },
      { range: [7, 8], goal: 'My father sent me a concerning letter. I want someone to check up on him.', questions: "What did the letter suggest? Why can't they go themselves?" },
      { range: [9, 10], goal: "My cousin is addicted to [CHEMS]. I'd do anything to get them clean.", questions: 'How long have they suffered? How do they get ahold of the drugs?' },
      { range: [11, 12], goal: "Raiders have kidnapped someone close to me. I can't rescue them alone.", questions: "Who did they kidnap? What are the Raiders' intentions?" },
      { range: [13, 14], goal: 'My brother wants to throw away everything our family has built. I need you to convince them to reconsider.', questions: 'What are they throwing away? Why would they listen to you?' },
      { range: [15, 16], goal: "My child wants to travel the Wasteland. Show them that it's far too dangerous for them out there.", questions: 'What would scare them? Why do they want to travel the Wasteland?' },
      { range: [17, 18], goal: 'The world thinks my family and I are monsters. Help me prove them wrong/right.', questions: 'What tales do they tell of the family? What started the misconception?' },
      { range: [19, 20], goal: 'A unique inheritance is ripping our family apart. Help us decide what to do with it.', questions: 'What wealth is at stake? Who is positioned to gain/lose the most?' }
    ]
  },
  {
    name: 'Community',
    flavor: "This isn't about me, this is about everyone.",
    goals: [
      { range: [1, 2], goal: 'A close friend is getting married, and I want to throw them a party.', questions: "What does a good party need that they are missing? Who's the lucky couple/polycule?" },
      { range: [3, 4], goal: 'Our settlement is missing a luxury resource.', questions: 'Well, what is it? Chems, drink, comics? Why do they crave this in particular?' },
      { range: [5, 6], goal: "I want a group to truly call my own. I don't feel at home in this community.", questions: "Why aren't they comfortable/welcomed here? Who do they feel are \"their people\"?" },
      { range: [7, 8], goal: "I witnessed a heinous crime in my community. I don't know what to do.", questions: "What was the crime? Why can't they bring it to the authorities?" },
      { range: [9, 10], goal: "We're not safe here anymore. Help us find a new place to live.", questions: "What's the danger? Why is it a new problem?" },
      { range: [11, 12], goal: "Two rivaling [FACTIONS] are looking to take over our community. We'd like you to be our spokesperson.", questions: 'What can each faction offer/threaten? Why is this community valuable?' },
      { range: [13, 14], goal: "There's been a massive influx of people. Find out where they're coming from.", questions: 'Are the people welcome? Are there enough resources for everyone?' },
      { range: [15, 16], goal: "The radio brings us together, but it's only playing static. Get the station back online.", questions: 'How was the radio damaged? How long has it been down?' },
      { range: [17, 18], goal: 'Two [FACTIONS] are bringing their rivalries into our community and disrupting our settlement. Make sure they settle their differences and leave us in peace.', questions: "What are the factions' beef with each other? Why can't the community handle this on their own?" },
      { range: [19, 20], goal: "I suspect there's a rot at the heart of my community, but I can't investigate without arousing suspicion.", questions: 'Who is at the heart of the corruption? What power protects them from investigation?' }
    ]
  },
  {
    name: 'Information',
    flavor: "Some people say Caps make the world go round. That's half true, information does, but caps buy information.",
    goals: [
      { range: [1, 2], goal: "Knowledge is power. Hack an [NPC]'s terminal to get me some leverage. And don't get caught.", questions: 'What are they expecting to find? Why are you the right person for the job?' },
      { range: [3, 4], goal: "A commercial facility has schematics I'm very interested in seeing. You can keep any loot you find, just bring me those plans!", questions: 'What pre-War company owned the facility? What do the schematics show? Are you told what you are looking for?' },
      { range: [5, 6], goal: "[FACTION] is trying to hide their activities. I want to know what they're up to and why they're so secretive about it.", questions: 'Why does the quest giver want to know? What is immediately unusual about the activity?' },
      { range: [7, 8], goal: 'I have recently come into possession of an important holotape. I need to deliver it to an [NPC].', questions: "Who does it need delivering to? Why can't you listen to the tape?" },
      { range: [9, 10], goal: "I found this book on my travels. I've read it many times, and I think it's time it found a good home.", questions: "What's the book? What fate does it deserve?" },
      { range: [11, 12], goal: 'I am conducting research. I want you to gather some samples for me.', questions: "What are they samples of — creatures, plants, dust? What's stopping them from handling it themselves?" },
      { range: [13, 14], goal: "I've heard about you. There is a radio nearby that offers a finder's fee for interesting stories. Would you accompany me?", questions: 'What adventure have you been on they might have heard about? Why might you want the information kept private?' },
      { range: [15, 16], goal: "I've stumbled upon something I didn't want to know. What should I do now?", questions: "What's dangerous about the information? How can you help them resolve the dilemma?" },
      { range: [17, 18], goal: "I had an amazing idea when I was drunk, and now I can't remember it. Help me get back to the perfect state of inebriation with liquid inspiration.", questions: "What's your poison? Why is this a bad idea?" },
      { range: [19, 20], goal: 'All the robots are malfunctioning. I think I know why, but I need an assistant in my experiments.', questions: "What's the hypothesis? Why is it dangerous to test?" }
    ]
  },
  {
    name: 'Fame',
    flavor: "Hey, they used to look at famous people like gods! And tell me, who doesn't want to be a god?",
    goals: [
      { range: [1, 2], goal: "I've got a show a week from now. I've been practicing my act and need someone to provide security. People are coming from far and wide to see me.", questions: 'What is their show? Why do they need security?' },
      { range: [3, 4], goal: 'I worry that I will be forgotten. I need a monument that will put me on the map forever.', questions: 'What is their monument? What finishing touch does it need?' },
      { range: [5, 6], goal: 'My sibling is famous around these parts. Unfortunately, we were separated years ago, and they no longer recognise me. If only I could have a proper meeting with them.', questions: 'Why does the famous sibling not allow strangers close to them? Why are you in a unique position to help?' },
      { range: [7, 8], goal: "I've found this old Eyebot and want to personalise it.", questions: 'What does the Eyebot need to really pop? What special function or personality should it have?' },
      { range: [9, 10], goal: 'I need to know what people are saying about me!', questions: "Who would have the most useful gossip? Why can't they ask around themselves?" },
      { range: [11, 12], goal: "Someone's been spreading rumors about me. I want to know who and why.", questions: 'What is the rumor, and how damaging is it? Who benefits from spreading it?' },
      { range: [13, 14], goal: 'Everyone loves a radio station! Help me get one up and running.', questions: 'What kind of content will it broadcast? What obstacle is preventing it from going live?' },
      { range: [15, 16], goal: "Local famous [NPC] snubbed my fanmail. Deliver this package to them, and make sure they know it's me who sent it.", questions: "What's inside the package? Why might the recipient not want it?" },
      { range: [17, 18], goal: "I've heard of you. If what they say is true, you might be just who I've been looking for.", questions: 'What have they heard about you? What do they need you for?' },
      { range: [19, 20], goal: 'Oh my! You\'re "Them" aren\'t you?! Can I have your autograph?', questions: 'Why do they admire you so much? What unexpected request comes with the autograph?' }
    ]
  },
  {
    name: 'Power',
    flavor: 'I know\'s they say absolute pow\'a corrupts ab-so-lutely. But not me, I\'m di\'ren\'t — you\'ll see!',
    goals: [
      { range: [1, 2], goal: 'I used to rule this place, but now no one knows who I am. Help me get back on top.', questions: "How did they lose their position? What's the first step in reclaiming their power?" },
      { range: [3, 4], goal: "I've got dirt on an [NPC] and I need them to sweat. Just don't let them know who has the information.", questions: 'What is the incriminating information? How can you make them feel the pressure without revealing your hand?' },
      { range: [5, 6], goal: 'We are a completely fair and scrupulously democratic society, of course, and I need you to fix the next vote.', questions: 'What method do they want you to use? Who stands to lose the most if you succeed?' },
      { range: [7, 8], goal: 'Might makes right. With your help, no one will question my decisions again.', questions: 'What opposition do they currently face? Why might helping them be dangerous?' },
      { range: [9, 10], goal: 'Help me persuade people that we need a change of leadership.', questions: "What's their vision for change? Who will oppose this effort the most?" },
      { range: [11, 12], goal: "My predecessor alienated a lot of people. If we're to survive, I need to heal the rifts they left.", questions: 'What damage did their predecessor do? Who is the hardest to win over?' },
      { range: [13, 14], goal: "There's a power vacuum within [FACTION], time to put my hat in the ring. I trust I can rely on your support?", questions: 'Who are their biggest rivals? What do they offer you in return for your help?' },
      { range: [15, 16], goal: "An [NPC] hasn't sent what they owe me. Go and find out what the hold up is.", questions: 'What were they supposed to send? Why might they be stalling?' },
      { range: [17, 18], goal: 'I am already powerful, but I do not know whether I want to be feared or to be loved. Which is better?', questions: 'What makes them ask this question? What happens if they pick the wrong path?' },
      { range: [19, 20], goal: "There's an item out there that I can harness for great power. Get it for me and I'll share its secrets with you.", questions: 'What is the item, and what kind of power does it hold? Who else is looking for it?' }
    ]
  },
  {
    name: 'Love',
    flavor: "Every story's a love story, really! And all love stories always end all happy-like!",
    goals: [
      { range: [1, 2], goal: "I've noticed two [NPCs] making eyes at each other. I've always fancied myself as a matchmaker.", questions: 'What is keeping them from getting together? Is this true love, or is something else going on?' },
      { range: [3, 4], goal: 'The [NPC] I love is with another. It would be terrible if something happened to their partner.', questions: "How happy is the target of the quest giver's affection in their relationship? How far are they really willing to go?" },
      { range: [5, 6], goal: 'I want to surprise my partner with a gift. I need help searching for the perfect thing.', questions: 'What kind of gift would truly suit them? Why is it difficult to find?' },
      { range: [7, 8], goal: 'I am fighting with an [NPC] for the heart of the same person. I need to get the upper hand somehow.', questions: 'What makes the person worth competing for? How does the centre of the love triangle feel about the matter?' },
      { range: [9, 10], goal: "I'm planning a surprise. Help me scavenge the things I need.", questions: 'What exactly are they planning? Why is finding these items a challenge?' },
      { range: [11, 12], goal: "I feel that an [NPC] doesn't realize how much we appreciate them. Help me show them how much they mean to all of us.", questions: 'What have they done to earn such admiration? How can you make the gesture truly meaningful?' },
      { range: [13, 14], goal: "I've got a crazy idea to impress the person I love, I just need someone to help me execute it.", questions: "What's the plan, and why is it risky? How could this go horribly wrong?" },
      { range: [15, 16], goal: "I'm in love with a member of [FACTION], but their Faction doesn't approve. Help me get a message to them.", questions: 'Why is the faction against their relationship? How can the message be delivered without causing trouble?' },
      { range: [17, 18], goal: 'My Cyberdog needs repairs. Please help.', questions: "What's wrong with the Cyberdog? Why can't it be replaced?" },
      { range: [19, 20], goal: "I'll never love again after [FACTION] took my partner. The best I can hope for is revenge.", questions: 'What happened to their partner? What form of revenge are they seeking?' }
    ]
  },
  {
    name: 'Survival',
    flavor: "I'm gunna make it; I'll keep on survivin'",
    goals: [
      { range: [1, 2], goal: "There's a prime location for a Settlement not too far from here. The problem is it's already inhabited. Help us clear it out.", questions: 'Who currently occupies the location? What makes it worth fighting for?' },
      { range: [3, 4], goal: 'I worry about running out of food. I need a renewable source of sustenance.', questions: 'What options are available for long-term food supply? What threats or obstacles make this difficult?' },
      { range: [5, 6], goal: "I believe that an [NPC] is out to get me. It's them or me.", questions: "What makes them think they're in danger? Do they have proof, or is this paranoia?" },
      { range: [7, 8], goal: 'Nearby Settlements are refusing to trade with us. Help us find out why.', questions: 'What changed to cause the cutoff? How can you regain their trust?' },
      { range: [9, 10], goal: '[FACTION] is taking a worryingly high amount of interest in us. Can you find out why?', questions: 'Do they come in peace, or with threats? What might they want from the NPC?' },
      { range: [11, 12], goal: 'Can you help me create a new edition of the Wasteland Survival Guide?', questions: 'What new survival topics need to be covered? What challenges come with gathering the information?' },
      { range: [13, 14], goal: 'We need a better water source. Can you help us?', questions: "What's wrong with the current water supply? What dangers might come with securing a new one?" },
      { range: [15, 16], goal: 'Something is stalking me. I need your help to trap it.', questions: "What signs suggest they're being hunted? What makes the predator particularly dangerous?" },
      { range: [17, 18], goal: "I've found something that's more than I can deal with. Can you get word to my [FACTION] to send help?", questions: 'What did they discover? Why is it too dangerous to handle alone?' },
      { range: [19, 20], goal: 'Our Settlement is under attack. We need your aid.', questions: 'Who or what is attacking? Which settlement is it?' }
    ]
  },
  {
    name: 'Food',
    flavor: "A full belly is all I need to be happy, shame there ain't much food going round…",
    goals: [
      { range: [1, 2], goal: "I've heard a rumor that a famed cook is moving through the Wasteland. His next stop is nearby, and I'd give anything to be there.", questions: "What makes this cook so legendary? Why can't they go there alone?" },
      { range: [3, 4], goal: "I'm working on a recipe, but I need a very hard-to-get ingredient. Get it for me and I'll reward you handsomely.", questions: 'What is the ingredient, and why is it so rare? What makes it dangerous to acquire?' },
      { range: [5, 6], goal: "I've got a craving for Deathclaw omelette, but not a death wish. That's where you come in.", questions: 'Can Deathclaw eggs be found in the wild or through barter? What craving does the quest giver believe a Deathclaw omelette will fulfill?' },
      { range: [7, 8], goal: "If I have to eat another Salisbury Steak, I'll lose it. Get me something I've never had before.", questions: "What kind of thing do they like — savoury/sweet/pre-war? Why can't they get it themselves?" },
      { range: [9, 10], goal: "I love the zip of Nuka-Cola. I've heard about an abandoned container nearby that supposedly contains the motherlode.", questions: 'How much we talking — a crate, a barrel, a shipping container? What dangers might be lurking near it?' },
      { range: [11, 12], goal: "There's a custom brewing robot in a brewery nearby. Get it back to me and I'll make sure your drinks are always on the house.", questions: 'What makes this brewing robot special? Why was it abandoned?' },
      { range: [13, 14], goal: 'I crave the flavor only Radiation can add. Bring me the most irradiated food you can find.', questions: "What's the most dangerously irradiated food out there? Can the quest giver survive eating it?" },
      { range: [15, 16], goal: "I'll pay good caps for blood packs, no questions asked.", questions: "Didn't you read the goal? No questions asked." },
      { range: [17, 18], goal: "I've got some fresh meat in the pot. Come have a bite, just stay out of the cellar.", questions: 'What is their secret? What will the NPC do if you expose them?' },
      { range: [19, 20], goal: "At night I restock Nuka-Cola machines! Last night's run left me injured, and I need someone to take up the mantle while I recover.", questions: 'What injured them? Why do it at night?' }
    ]
  },
  {
    name: 'Obsession',
    flavor: 'If I can get this, everything else will be okay, it will, I promise. Just need to STOP THEM from getting it…. Yeah… nearly there… all mine… all mine.',
    goals: [
      { range: [1, 2], goal: "I'm missing a few issues of Grognak the Barbarian, then my collection will be complete. Please help me find them.", questions: "What's special about the missing issues? Who else might be hunting for them?" },
      { range: [3, 4], goal: 'The whole world is a simulation! I need your help to prove it!', questions: 'What\'s their most convincing piece of evidence? What do they plan to do once they "prove" it?' },
      { range: [5, 6], goal: "People don't understand my genius, but I will make them understand! And you'll help me!", questions: 'What have they created that they believe proves their brilliance? Who are they desperate to impress?' },
      { range: [7, 8], goal: 'Someone stole a Vault-Tec bobblehead from my collection. I need it back, no matter what it takes.', questions: 'Why is this particular bobblehead so important to them? Who might have taken it and why?' },
      { range: [9, 10], goal: 'The Port-A-Diner nearby is mocking me! Look at that perfectly preserved pie! I NEED IT!', questions: "What's stopping them from getting the pie themselves? Why is this particular pie worth the effort?" },
      { range: [11, 12], goal: "Everyone's a Synth and I can prove it. I just need a few more parts to finish my EMP transmitter.", questions: 'What parts are they missing? Who might have a vested interest in stopping them?' },
      { range: [13, 14], goal: 'I swear I saw a flying saucer crash nearby. If you help me get there, I can prove that they\'re real at last!', questions: 'Why are they the only one who saw it? What else might it have been?' },
      { range: [15, 16], goal: 'Finally, the perfect weapon: part Shotgun, part Machine Gun, a decent amount of Rocket Launcher, and enough laser power to get the whole thing going. Now I just need help testing it.', questions: 'What could go horribly wrong with this weapon? Who might want to steal or sabotage it?' },
      { range: [17, 18], goal: "I gotta have the latest fashions. Are these the latest fashions? Are you sure? Go get me preserved pre-War clothes; they're the most in fashion right now.", questions: 'What kind of pre-War fashion are they looking for? Where might such pristine clothes still exist?' },
      { range: [19, 20], goal: 'Nothing scratches the itch anymore. Help me find the ultimate Chem!', questions: "What effect are they looking for? Why don't ordinary Chems cut it anymore?" }
    ]
  },
  {
    name: 'Excitement',
    flavor: 'I swear, the whole world gets blown to hell and it still manages to be insanely dull…',
    goals: [
      { range: [1, 2], goal: "I've never left the safety of my settlement before. Could you take me out on your next adventure?", questions: 'What has kept them from leaving before? What are they excited to see?' },
      { range: [3, 4], goal: "I need to blow off some steam. Let's go on a bar crawl and see where the night takes us.", questions: "What's been stressing them out? What's the worst thing that could happen?" },
      { range: [5, 6], goal: 'My [FACTION] is so dull, I want to see how another [FACTION] does things. Can you sneak me in?', questions: "What do they dislike about their faction? What are the consequences if they're caught?" },
      { range: [7, 8], goal: "My partner wants to experience the Wasteland life. I'll pay good caps for you to keep them safe.", questions: 'Why does their partner want this experience? What do they think the Wasteland is like compared to reality?' },
      { range: [9, 10], goal: "I heard a nearby location is crawling with [CREATURES]. Let's go see them up close.", questions: 'Why are they so curious about this? Why is their presence strange?' },
      { range: [11, 12], goal: "There's supposed to be some huge [CREATURE] out in the woods. I wanna see it!", questions: 'What rumors have they heard about the monster? What do they plan to do if they actually find it?' },
      { range: [13, 14], goal: "I heard there's an unexploded nuke nearby. It must be worth a fortune; help me salvage it.", questions: 'How do they plan to disarm or move the bomb? What would be in danger if it went off?' },
      { range: [15, 16], goal: "I found a poor abandoned mutant puppy out in the Wastes. It can't be that hard to train, Super Mutants do it after all.", questions: 'What kind of mutant [CREATURE] will it grow into? Why might keeping it be a terrible idea?' },
      { range: [17, 18], goal: 'I never felt so alive as when I was in the midst of a firefight. Help me feel that again.', questions: "What event made them crave the thrill of combat? What's the risk of indulging this obsession?" },
      { range: [19, 20], goal: "There's a rumor of a perfectly preserved [LOOT] nearby. Could you imagine what it would be like to have one of those!?", questions: 'What makes this item so special? Who else might be searching for it?' }
    ]
  },
  {
    name: 'Purpose',
    flavor: 'I was lost when the Brotherhood found me, now I have purpose. You can too, if you stand with me.',
    goals: [
      { range: [1, 2], goal: 'I have the ashes of my mother that I want to spread in a special location. I feel drawn to take it where it needs to go.', questions: 'What did the relation mean to the NPC? What was their final wish?' },
      { range: [3, 4], goal: "I've lost everything, but I refuse to be beaten. Help me find purpose again.", questions: 'What did they lose, and how? What kind of purpose are they searching for?' },
      { range: [5, 6], goal: 'I will rise within the ranks of [FACTION], no matter what.', questions: 'What is their current standing in the faction? What are they willing to do to climb higher?' },
      { range: [7, 8], goal: "My mother always hoped that I would carry on the family business, but my heart's just not in it. Truly, I want to take up a different [PROFESSION].", questions: 'What is the family business? Why do they feel drawn to this new profession?' },
      { range: [9, 10], goal: "I can't go on. I need you to finish a task for me.", questions: 'What prevents this character from continuing their purpose?' },
      { range: [11, 12], goal: "People rely on me, but I know I won't be around for much longer. Make sure I don't let them down.", questions: "Who relies on them, and for what? Why won't they be around much longer?" },
      { range: [13, 14], goal: 'No matter how I try, I can never beat my rival [NPC]. Could you help train me so I can take them down?', questions: 'Why is this rivalry so important? What kind of training do they need?' },
      { range: [15, 16], goal: '[FACTION] must be brought down, and the best way is from the inside.', questions: 'What did this faction do to earn their hatred? How far are they willing to go to destroy it?' },
      { range: [17, 18], goal: 'I was saved by a mysterious stranger. Help me find and repay them.', questions: 'What happened when the stranger saved them? What little details do they remember that might help find them?' },
      { range: [19, 20], goal: 'My [FACTION] should be in control of the Wasteland. Help me spread their influence.', questions: "What is their faction's vision for the Wasteland? Who stands in their way?" }
    ]
  },
  {
    name: 'Redemption',
    flavor: "The Enclave made me do awful things. I don't know if I'll ever get those stains from my hands.",
    goals: [
      { range: [1, 2], goal: "A long time ago, I betrayed an ally. I want to make amends, but I've no idea where to find them.", questions: 'What did they do to betray their ally? Why do they want to make amends now?' },
      { range: [3, 4], goal: "I promised to help reclaim a nearby location for my [FACTION] but abandoned them. I hope it's not too late to keep my promise.", questions: 'Why did they abandon their faction? What state is the location in now?' },
      { range: [5, 6], goal: 'I stole schematics from [FACTION]. I regret my actions and hope that making them a reality will ingratiate me to them.', questions: 'What do the schematics contain? What do the schematics need to become a reality?' },
      { range: [7, 8], goal: "I've done awful things to feed my habit. I need to get clean.", questions: "What is their vice? What's stopping them from quitting?" },
      { range: [9, 10], goal: "I recognised an [NPC] as someone who left me for dead years ago. How can I tell them that I don't blame them for what they did?", questions: 'What were the circumstances of being left for dead? How do they think the NPC will react?' },
      { range: [11, 12], goal: "I've taken so much from others, now I want to give back.", questions: "What was the worst thing they've done? How do they plan to give back?" },
      { range: [13, 14], goal: 'People are getting hurt because of something I did. I need to put this right.', questions: 'What did they do to cause harm? Who is still suffering from their actions?' },
      { range: [15, 16], goal: "I've been sending people into traps for years, but it ends here.", questions: 'What happens to the victims? Why did they start?' },
      { range: [17, 18], goal: "I've realized my [FACTION]'s methods have been doing more harm than good. I need to put things right.", questions: 'What specific harm has their faction caused? How much danger are they in by trying to change things?' },
      { range: [19, 20], goal: 'So many people weigh down my conscience. Help me put them to rest.', questions: 'Who haunts their conscience the most? What do they believe will bring them peace?' }
    ]
  },
  {
    name: 'Distraction',
    flavor: 'Rads got me all twisted inside, Doc says I got days left maybe. I just need to take my mind off of it.',
    goals: [
      { range: [1, 2], goal: 'Life is getting a little dull. I need something to spice it up.', questions: "What have they done before to entertain themselves? What's the wildest thing they've ever tried?" },
      { range: [3, 4], goal: "I've played this holotape to death. Bring me a new holotape game.", questions: 'What kind of game are they looking for? What do they have to play it on?' },
      { range: [5, 6], goal: "I want to prank an [NPC] by doing something that'll really rile them up.", questions: "What's the best prank they've pulled before? Why do they want to mess with this NPC?" },
      { range: [7, 8], goal: "I'm putting on a show, but I need a few more acts. Will you be my talent scout?", questions: 'What kind of show is it? What sort of talent are they looking for?' },
      { range: [9, 10], goal: "We deserve a party. I've got a list of stuff that every party needs.", questions: "What's the theme of the party? What's the most important item they need?" },
      { range: [11, 12], goal: "Someone's after me. I need you to throw them off my scent.", questions: 'Who is after them, and why? How much danger are they really in?' },
      { range: [13, 14], goal: "This item needs to find its way into an [NPC]'s possession without them noticing.", questions: 'What is the item? Why does it need to be placed secretly?' },
      { range: [15, 16], goal: 'I have recently come into quite a fortune. I want you to help me spend it.', questions: 'How did they acquire this fortune? What entertainment do they want?' },
      { range: [17, 18], goal: "I need a distraction tomorrow, and I don't plan on telling you why.", questions: 'What time do they need the distraction? How long does it need to last?' },
      { range: [19, 20], goal: '[FACTION] has their eye on a nearby location. Keep them away long enough for my faction to clear the place out.', questions: "What's so valuable about the location? How far is the other faction willing to go to claim it?" }
    ]
  },
  {
    name: 'Safety',
    flavor: 'All any of us really want is a bed to sleep on, and a roof over our heads.',
    goals: [
      { range: [1, 2], goal: 'An old friend knows too much about me. They pose a danger that must be eliminated.', questions: 'What exactly do they know? Do they have any leverage, or is this purely precautionary?' },
      { range: [3, 4], goal: "I've always been a bad shot. Some experience would go a long way in helping me protect myself.", questions: "Have they ever been in a firefight before? What's their preferred weapon?" },
      { range: [5, 6], goal: "I've planned defenses to keep my home safe. I just need the supplies to make them.", questions: 'What kind of defenses are they planning? Who or what are they defending against?' },
      { range: [7, 8], goal: "I've heard things moving around my home at night. I don't know what they are, but they have to go.", questions: 'Have they seen any signs of intruders? Do they suspect something supernatural?' },
      { range: [9, 10], goal: "[FACTION] has been threatening me. Help me show them I'm not to be trifled with.", questions: 'What started the conflict? Do they want a show of force, or something more subtle?' },
      { range: [11, 12], goal: "I need better equipment if I'm going to stay ahead of my rivals. Can you help me?", questions: 'Who are their rivals? What kind of gear would give them the edge?' },
      { range: [13, 14], goal: "There has been an increase in [CREATURES] in the area. Find out where they're coming from and stop them.", questions: 'Have there been any survivors or witnesses? What kind of threat are they dealing with?' },
      { range: [15, 16], goal: 'Someone is trying to blackmail me. Find out who and put a stop to it.', questions: 'What information are they using as leverage? How far is the target willing to go to keep it secret?' },
      { range: [17, 18], goal: 'My [FACTION] has abandoned me. Can you talk some sense into them?', questions: 'Why did the Faction leave them behind? Why would you be able to help?' },
      { range: [19, 20], goal: 'I am worried about the Raiders nearby spreading their influence across the Wasteland.', questions: 'Why has this gotten worse recently? Why does this affect the quest giver specifically?' }
    ]
  },
  {
    name: 'Escape',
    flavor: 'I NEED to get out of here, no matter what.',
    goals: [
      { range: [1, 2], goal: 'I need a new start. Help me fake my death and get out of here.', questions: 'Who are they running from? What will their new identity be?' },
      { range: [3, 4], goal: 'Help me spread wild rumors so people will leave me alone.', questions: 'What kind of rumors would be the most effective? Who do they want to scare off or mislead?' },
      { range: [5, 6], goal: 'No one must ever know who I was before. Can you help me bury my secrets?', questions: 'What are they hiding? Is there anyone still out there looking for them?' },
      { range: [7, 8], goal: '[FACTION] has information on me. Sneak into their base and get those files.', questions: 'What kind of information do they have? Is destroying the files enough, or do they need more drastic action?' },
      { range: [9, 10], goal: "I've angered the wrong people. Help me lie low for a while until this blows over.", questions: "Who's after them, and what did they do? How long do they need to stay hidden?" },
      { range: [11, 12], goal: "I waited all night for my partner so we could get out of here, but they never showed. I can't leave without them.", questions: 'Where were they supposed to meet? Is it possible their partner was taken or betrayed them?' },
      { range: [13, 14], goal: 'I need the sweet relief of [CHEMS], as many as you can get.', questions: "What happens if they can't get their fix? Why is this a terrible idea?" },
      { range: [15, 16], goal: 'I used to sneak out all the time, but recent Raider attacks have led to tightened security. Help me get a taste of freedom again.', questions: 'Why is escaping so important to them? Where do they want to go?' },
      { range: [17, 18], goal: "I'm being held against my will. Help me get out of here.", questions: 'Who is keeping them locked up, and why? Are they truly a prisoner, or is there another side to the story?' },
      { range: [19, 20], goal: "An [NPC] is out to get me. I can't prove it, but I know it's true.", questions: 'What makes them so sure? What lengths are they willing to go to in order to protect themselves?' }
    ]
  },
  {
    name: 'Technology',
    flavor: 'The old world made a lot of mistakes. But their tech was not one of them. Merely how they used it.',
    goals: [
      { range: [1, 2], goal: 'Not everyone can be trusted with technology. I need you to take technology from those who abuse it.', questions: 'What kind of tech are we talking? Who is abusing the technology, and how?' },
      { range: [3, 4], goal: 'I need to upgrade my equipment. Can you help me scavenge the resources I need?', questions: 'What equipment do they want to upgrade? What new function do they want it to have?' },
      { range: [5, 6], goal: "I've lost the password to control my turrets, and they're going haywire. Help me fix this.", questions: 'What do the malfunctioning turrets protect? Who set the password in the first place?' },
      { range: [7, 8], goal: 'I have the outlines of some old experiments designed to help everyone. I just need some suitable test subjects.', questions: 'What kind of tests are these? What happened to the pre-war test subjects?' },
      { range: [9, 10], goal: "[FACTION] have no idea what they've got their hands on. Convince them it would be better in my hands than theirs.", questions: 'What is the technology in question? What makes them think they deserve it more?' },
      { range: [11, 12], goal: "I've heard there's some Power Cores nearby, but it's far too dangerous for me to retrieve them. You, on the other hand…", questions: 'Why are they still there after all this time? What dangers lurk in the location?' },
      { range: [13, 14], goal: "My old Power Armor is damaged beyond my skills to repair, but I've heard that an [NPC] can help. Can you get a message to them?", questions: "What's unique about this suit? Why can't they go themselves?" },
      { range: [15, 16], goal: "I found a manifest for some undelivered robot parts. Help me locate the shipment and I'll share it with you.", questions: 'What kind of robot parts are they looking for? Who might already be after them?' },
      { range: [17, 18], goal: "I need a specific item to complete my project. Get it for me and I'll make it worth your time.", questions: 'What is the project, and how will it change things? Why is this item so hard to get?' },
      { range: [19, 20], goal: 'I need to field test my latest invention. Run it through its paces for me, and you can have the prototype.', questions: 'What does the invention do? What could go wrong during testing?' }
    ]
  }
];

/** Goal Type table (pg.196): 1-18 map to types; 19-20 = choose any. */
export const rollGoalType = (): GoalType => {
  const r = roll(20);
  const index = r >= 19 ? roll(18) - 1 : r - 1;
  return GOAL_TYPES[index];
};

export const rollGoal = (type: GoalType): SideQuestGoal =>
  fromRange(type.goals, roll(20));

// ===================== SIDE QUEST PIPELINE (Ch.6) =====================
export interface SideQuest {
  rewardName: string;
  rewardDescription: string;
  goalType: string;
  goal: string;
  questions: string;
  /** Map location number (1-20) where the quest resolves. */
  location: number;
  status: string;
}

/** Full book pipeline: Reward → Goal Type → Goal → Location (d20).
 *  `currentLocation` triggers the book's optional re-roll when the quest
 *  lands where you already are. */
export const generateSideQuest = (currentLocation?: number): SideQuest => {
  const reward = rollQuestReward();
  const type = rollGoalType();
  const goal = rollGoal(type);
  let location = roll(20);
  if (currentLocation !== undefined && location === currentLocation) {
    location = roll(20);
  }
  return {
    rewardName: reward.name,
    rewardDescription: reward.description,
    goalType: type.name,
    goal: goal.goal,
    questions: goal.questions,
    location,
    status: 'Active'
  };
};

/** Back-compatible generator returning the {goal, blocker, status} shape used by DataTab. */
export const generateQuest = (): { goal: string; blocker: string; status: string } => {
  const quest = generateSideQuest();
  return {
    goal: `[${quest.goalType}] ${quest.goal} (Location ${quest.location} | Reward: ${quest.rewardName})`,
    blocker: quest.questions,
    status: 'Active'
  };
};

// ===================== MAIN QUEST BLOCKERS (pg.74-75) =====================
export interface MainQuestBlocker {
  range: [number, number];
  name: string;
  description: string;
}

export const MAIN_QUEST_BLOCKERS: MainQuestBlocker[] = [
  { range: [1, 2], name: 'Unknown Location', description: "You don't know where you're going and will need additional information. You will need to find a map or a knowledgeable NPC to tell you where to look first. Skip the Blocker Location step. Whenever you gain a reward from a Side Quest, you may replace the reward with the missing information and re-roll on this Table, re-rolling any additional rolls of 1 or 2. Replace this Blocker with the newly rolled one, and then generate a Blocker Location." },
  { range: [3, 4], name: 'Guarded', description: 'Your goal is heavily guarded by a set of threats that will require eliminating, bypassing, or distracting. When you arrive at the Blocker Location, [GENERATE A FOE].' },
  { range: [5, 6], name: 'Restricted Area', description: 'Your goal lies in an area of the Wasteland that you are not allowed, such as a hostile settlement or a private area of a friendly location. Generate a Settlement, owned by a generated [FACTION].' },
  { range: [7, 8], name: 'Locked Down', description: 'Your goal is hidden within a facility that requires either a Key, Passcode, or a Difficulty 4 Lockpick or Science Skill Test to open. Whenever you gain a reward from a Side Quest, you may replace the reward with the Key or Passcode for this Blocker.' },
  { range: [9, 10], name: 'Irradiated', description: 'Your goal lies within a heavily irradiated location you will need to protect yourself from in order to reach it. The Blocker Location gains the Irradiated Truth.' },
  { range: [11, 12], name: 'Mobile', description: 'The goal moves often, and you will need to find out how to track it down. Each time you Travel to a Location that is not the Blocker Location, roll a d20. On any result of 5 or lower, the Blocker Location moves to an Adjacent Unexplored Location, which becomes the Blocker Location. How your goal moves is part of the story; think over what makes this interesting and devise a way your character could work to overcome it.' },
  { range: [13, 14], name: 'Cost', description: "Completing this goal will come with some form of great personal cost to either you or a loved one. After rolling this Blocker, determine what that cost may be. This Blocker either requires acceptance of the cost or clever thinking to find a way around it." },
  { range: [15, 16], name: 'Hunted', description: 'There are those who would stop you from completing your goal. Generate a Foe who is constantly hounding your footsteps; the more dangerous the foe, the more thrilling the chase! Whenever you Travel, roll a d20. On the roll of a 19-20, your Hunter will appear during your next Encounter. Each time you Travel without meeting your Hunter, the range of this roll increases by 1 (e.g., from 19-20, to 18-20, then 17-20, and so on); if you meet your Hunter, the range resets to 19-20.' },
  { range: [17, 18], name: 'Politics', description: 'Your goal is at the center of a political dispute between two rival settlements, a dispute that must be settled before you can move to reach it. When you determine your Blocker Location, generate two Settlements in directly adjacent locations, then generate two different Factions that are opposed to one another. Both Factions are militarized against one another to lay claim to your goal, and you must either side with one or deescalate both to claim the goal yourself. Doing anything else will inevitably turn both Factions against you.' },
  { range: [19, 20], name: 'Split', description: 'Your goal has been split between two locations, either actually physically broken apart or with something in one Location actively blocking the other. When you reach your Goal for the first time, you find half of your Goal and generate a Side Quest. The reward for this Side Quest will always be the Location of the other half of your Goal. Once you complete the Side Quest, generate another Blocker and Blocker Location in an Unexplored Location, which is now where the other half of your Goal resides.' }
];

export const rollMainQuestBlocker = (): MainQuestBlocker =>
  fromRange(MAIN_QUEST_BLOCKERS, roll(20));

// ===================== CLEAR BLOCKER TABLE (pg.158) =====================
// Roll d20 + character Level.
export interface ClearBlockerResult {
  range: [number, number];
  name: string;
  effect: string;
}

export const CLEAR_BLOCKER_TABLE: ClearBlockerResult[] = [
  { range: [1, 20], name: 'New Blocker', effect: "You aren't there yet; generate a new Blocker." },
  { range: [21, 23], name: 'Failure', effect: 'You may either generate a new Blocker or give up on your Quest. If you give up, write a final journal entry detailing why you consider the quest impossible.' },
  { range: [24, 26], name: 'Sacrifice', effect: 'You may either generate a new Blocker or succeed at your Quest at great personal cost. If you sacrifice, write a final journal entry detailing why you wish you had never succeeded.' },
  { range: [27, 29], name: 'Guilt', effect: 'You may either generate a new Blocker or succeed at your Quest at the expense of others. If you choose to sacrifice someone, pick your favourite NPC and write a final journal entry detailing how they died to bring about your triumph.' },
  { range: [30, 32], name: 'Change', effect: 'You may either generate a new Blocker or succeed at your Quest by giving up one of your most fervently held beliefs. If you do, write a final journal entry detailing what belief you had that has now been stripped from you.' },
  { range: [33, 35], name: 'Unforeseen Consequences', effect: 'You may either generate a new Blocker or succeed at your Quest, only to realize the world is now worse for it. If you do, write a final journal entry detailing how your success made things worse.' },
  { range: [36, 38], name: 'Pyrrhic Victory', effect: 'You may either generate a new Blocker or succeed at your Quest, but the rewards are far less than you hoped. If you do, write a final journal entry about the hollow feeling left behind.' },
  { range: [39, 41], name: 'Broken Bonds', effect: 'You may either generate a new Blocker or succeed at your Quest by severing a relationship that once defined you. Write a final journal entry about who you lost and why they will never forgive you.' },
  { range: [42, 44], name: 'Redemption', effect: 'You succeed at your Quest in a way that undoes past mistakes. Write a final journal entry about how this victory brings you peace.' },
  { range: [45, 47], name: 'Reunion', effect: 'You succeed at your Quest while reconnecting with someone you thought lost. Write a final journal entry about how their presence changes everything.' },
  { range: [48, 50], name: 'Unexpected Reward', effect: 'You succeed at your Quest and gain something wonderful you never even sought. Write a final journal entry about the unexpected joy or fortune that came from your journey.' },
  { range: [51, 999], name: 'True Victory', effect: 'You succeed at your Quest without compromise. Write a final journal entry about the moment you realize you have done what no one else could.' }
];

export const rollClearBlocker = (characterLevel: number): ClearBlockerResult =>
  fromRange(CLEAR_BLOCKER_TABLE, roll(20) + characterLevel);
