import { SITE_NAME } from "@/lib/site";

export type AuthorProfile = {
  name: string;
  photo: string;
  bio: string;
  website?: string;
};

const defaultAuthorPhoto =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80";

const authorProfiles: Record<string, AuthorProfile> = {
  "Godfrey Benjamin": {
    name: "Godfrey Benjamin",
    photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    website: "https://www.thecoinrepublic.com/",
    bio: "Godfrey Benjamin is an experienced crypto journalist whose main goal is to educate everyone around him about the prospects of Web 3.0. His love for crypto was birthed when, as a former banker, he discovered the obvious advantages of decentralized money over traditional payments. With his vast experience covering various aspects of Web3, Godfrey's articles has been featured on Blockchain.news, Cryptonews and Coingape, among others."
  },
  "Arthur Sterling": {
    name: "Arthur Sterling",
    photo:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    bio: "Arthur Sterling covers politics and global affairs with a focus on policy impact and institutional dynamics."
  },
  "Julian Vane": {
    name: "Julian Vane",
    photo:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    bio: "Julian Vane writes on business and markets, translating complex financial shifts into clear reporting."
  },
  "Eleanor Thorne": {
    name: "Eleanor Thorne",
    photo:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
    bio: "Eleanor Thorne reports on culture and society, highlighting the human stories behind major headlines."
  },
  "Grant Mitchell": {
    name: "Grant Mitchell",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    bio: "Grant Mitchell focuses on security and geopolitics, with deep coverage of conflict and diplomacy."
  },
  "Clara Whitmore": {
    name: "Clara Whitmore",
    photo:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    bio: "Clara Whitmore covers technology and science, exploring how innovation reshapes economies and daily life."
  }
};

export function getAuthorProfile(name: string): AuthorProfile {
  const trimmedName = name.trim().replace(/\s+/g, " ");
  if (authorProfiles[trimmedName]) {
    return authorProfiles[trimmedName];
  }

  const lower = trimmedName.toLowerCase();
  const keyMatch = Object.keys(authorProfiles).find((key) => key.toLowerCase() === lower);
  if (keyMatch) {
    return authorProfiles[keyMatch];
  }

  return {
    name: trimmedName || "News Desk",
    photo: defaultAuthorPhoto,
    bio: `Editorial coverage from ${SITE_NAME}.`
  };
}
