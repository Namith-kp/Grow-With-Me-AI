export const BANNED_WORDS: string[] = [
	// Keep this list small and maintainable; expand as needed
	// Words should be lowercase
	"abuse",
	"hate",
	"racist",
	"sexist",
	"nigger",
	"faggot",
    "nigga",
    "niggers",
    "niggas",
    "fuck",
    "fucks",
    "fucking",
    "fucked",
    "fucker",
    "fuckers",
    "fuckyou",
    "fuckywuck",
    "fuckywuckers",
    "fuckywucker",
    "fuckywuckers",
    "fuckywuckers",
    "fuck-you",
    "fuck-you-asshole",
    "fuck-you-motherfucker",
    "fuck-you-bullshit",
    "fuck-you-asshole",
    "fuck-you-motherfucker",
    "fuck-you-bullshit",
    "ugly",
    "ugliness",
    "uglyness",
    "ugly",
    "racism",
    "racisums",
    "narzism",
    "narzisms",
    "narzist",
    "narzists",
    "narzistic",
    "narzisticness",
    "narzist",
    "rape",
    "rapes",
    "raping",
    "rapist",
    "rapists",
    "rapistic",
    "rapisticness",
    "rapist",
    "rapists",
    "rapistic",
    "rapisticness",
    "raper",
    "rapers",
    "raping",
    "raped",
    "ugliness",
    "uglyness",
    "fatherfucker",
    "mf",
    "mfs",
    "mfers",
    "sex",
    "sexy",
    "sexists",
    
    "blowjob",
    "blowjobs",
    "handjob",
    "handjobs",
    "pussy",
    "pussies",
    "cunt",
    "cunts",
    "cunt",
    "cunts",
    "cock",
    "cocks",
    "cock",
    "dick",
    "dicks",
    "fucku",
    "fuckyouasshole",
    "fuckyoumotherfucker",
    "fuckyoubullshit",
    "fuckyouasshole",
    "fuckyoumotherfucker",
    "fuckyoubullshit",
    "bitch",
    "bitches",
    "bitchy",
    "bitchyness",
    "fuckyoubitch",
    "fuckyoubitches",
    "fuckyoubitchy",
    "fuckyoubitchyness",
    "racist",
    "racists",
    "moron",
    "morons",
    "moronic",
    "moronicness",
    "fuckyoumoron",
    "fuckyoumorons",
    "fuckyoumoronic",
    "fuckyoumoronicness",
    "shit",
    "shits",
    "shitty",
    "shittyness",
    "fuckyoushitty",
    "fuckyoushittyness",
    "fuckyoushit",
    "fuckyoushitty",
    "stupido",
    "stupidos",
    "stupido",
    "crap",
    "craps",
    "crapy",
    "crapyness",
    "fuckyouchap",
    "fuckyouchapness",
    "fuckyouchap",
    "sexyness",
    "sexyness",
	"bastard",
	"whore",
	"slut",
    "sluts",
    "slutty",
    "sluttyness",
    "fuckyouslut",
    "fuckyousluts",
    "fuckyouslutty",
    "fuckyousluttyness",
	"asshole",
	"motherfucker",
	"bullshit",
];

const bannedRegex = new RegExp(`\\b(${BANNED_WORDS.map(w => w.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")).join("|")})\\b`, "i");

export function containsAbusiveLanguage(input?: string | null): boolean {
	if (!input) return false;
	return bannedRegex.test(input.toLowerCase());
}

export function filterAbusiveText(input?: string | null): string {
	if (!input) return "";
	let output = input;
	for (const word of BANNED_WORDS) {
		const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "gi");
		output = output.replace(re, "***");
	}
	return output;
}

export function validateNoAbuseOrThrow(label: string, value?: string | null) {
	if (containsAbusiveLanguage(value)) {
		throw new Error(`${label} contains inappropriate language.`);
	}
}

export function validateStringArrayNoAbuseOrThrow(label: string, values?: string[] | null) {
	if (!values || values.length === 0) return;
	for (const v of values) {
		if (containsAbusiveLanguage(v)) {
			throw new Error(`${label} contains inappropriate language.`);
		}
	}
}
