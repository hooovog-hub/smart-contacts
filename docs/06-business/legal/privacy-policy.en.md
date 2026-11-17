# Smart Contacts Privacy Policy

Version 1.0 · Effective 18 November 2026

This policy explains in plain words what data the Smart Contacts app (iOS) and the website smart-contacts.vercel.app process, why, who receives it, how long it is kept and how to delete it.

## Contents

1. [Who we are and how to contact us](#1-who-we-are-and-how-to-contact-us)
2. [The short version](#2-the-short-version)
3. [What data we process](#3-what-data-we-process)
4. [Your public profile](#4-your-public-profile)
5. [Contacts from your phone](#5-contacts-from-your-phone)
6. [AI features](#6-ai-features)
7. [Why we use data](#7-why-we-use-data)
8. [Legal grounds](#8-legal-grounds)
9. [Who we share data with](#9-who-we-share-data-with)
10. [Where data is stored and transfers abroad](#10-where-data-is-stored-and-transfers-abroad)
11. [How long we keep data](#11-how-long-we-keep-data)
12. [Deleting your account and data](#12-deleting-your-account-and-data)
13. [Your rights](#13-your-rights)
14. [iPhone permissions](#14-iphone-permissions)
15. [Security](#15-security)
16. [Age](#16-age)
17. [Changes to this policy](#17-changes-to-this-policy)
18. [Version and date](#18-version-and-date)

## 1. Who we are and how to contact us

The data controller (in Armenian law, the "processor of personal data") is the individual **Hovhannes Ghazaryan**, Yerevan, Republic of Armenia. Below, "we".

For any question about your data, write to [hooovo.g@gmail.com](mailto:hooovo.g@gmail.com). We answer in Russian, Armenian or English.

This policy is based on the Law of the Republic of Armenia "On Protection of Personal Data" of 18 May 2015 (HO-49-N) and Apple App Store rules.

## 2. The short version

- **Your profile is public.** Your name, role, photo, phone number, links and other profile fields can be seen by anyone, through a link or QR code, without signing in. Do not add anything to your profile that you are not ready to show everyone.
- **Your contact book is private.** Only you see your contacts, notes, sections and AI conversations.
- **Contacts from your phone are uploaded only with your iOS permission.** We never message or call people in your book and we do not sell this data.
- **AI runs on Anthropic (Claude).** For AI features we send names, roles, companies, notes and section names. Contacts' phone numbers and emails are never sent to AI. Anthropic does not train its models on this data.
- **No ads, no third-party analytics, no tracking, no selling of data.**
- **You can delete your account in the app, immediately and completely**: Profile → Delete account.

## 3. What data we process

| Category | What exactly | Source | Who can see it |
|---|---|---|---|
| Account | Email and password (the password is stored only as a hash), or Sign in with Apple: Apple identifier, email (may be a hidden Apple address like ...@privaterelay.appleid.com), name on first sign-in | You and Apple | Only us, for service purposes |
| Profile | Name, profile address (handle), role, About, city, languages, phone, links (WhatsApp, Telegram, Instagram, LinkedIn, email), photo, brands and companies, organisation memberships, awards, Looking for, How I can help, endorsements, invite code | You | Everyone, see section 4 |
| Contact book | Contacts from your phone (name, phone number, company and job title, birthday), contacts added by QR or manually, your notes, sections, "met" marks | You | Only you |
| AI | Your requests to the AI assistant and its answers, tasks, "Worth writing today" suggestions with a ready message, an AI usage counter (which feature and when) | Created as you use the app | Only you |
| Invites and bonuses | Who signed up with whose code, whether a friend was counted, bonus months received | Created at sign-up with a code | The invitee sees their own record; the inviter sees only counts |
| Plan | Current plan and promo end date. After subscriptions launch, the subscription status from Apple (without your card details) | Us and Apple | Only us |
| Crash reports | Error text, technical stack trace, app version, platform, account identifier. Strings that look like phone numbers are masked; contacts' names, phone numbers and notes are never included | The app and our server | Only us |
| Technical logs | IP address, request time, device and browser type, recorded automatically by our hosting providers | Automatic | Only us and the provider |
| Meetings (feature in development) | Meeting title, place, time, participants, a guest's name, role and phone number, your "talked / did not talk" marks | You and participants | The organiser and participants |

We do **not** collect: location, health data, biometrics (Face ID runs inside your iPhone and tells us nothing), the advertising identifier, the list of your other apps, browsing history.

The camera and photo library are used only when you tap "Scan QR" or "Profile photo". Camera frames used to scan a QR code are not saved or sent anywhere. Only the photo you choose for your profile is uploaded to storage.

## 4. Your public profile

Smart Contacts is a digital business card, so the profile is public by nature:

- The page smart-contacts.vercel.app/your-handle opens for **anyone without signing in**, including from a QR code and an Apple Wallet card. Visitors can download your contact (name, role, phone) as a vCard.
- **The phone number in your profile is public.** WhatsApp and Telegram default to the same number; you can change or hide them.
- The core profile fields (name, role, city, languages, photo, phone, links, About, How I can help, invite code) are technically available to anyone, even without the link, for example through the service interface.
- Brands, organisation memberships, awards and Looking for are shown publicly on **Pro profiles**. Right now everyone has Pro for free (a 2-month promo from sign-up), so right now these blocks are public for everyone.
- If you move to Free, these blocks stop being shown to others but stay in your account.
- We cannot delete copies other people have made (a saved contact, a screenshot, a Wallet card on someone else's phone).

You decide what to fill in. You can change or delete any field at any time.

## 5. Contacts from your phone

**How it works.** The app reads contacts only after you allow it in the iOS system dialog. You can give access to selected contacts only (limited access in iOS 18) and withdraw it at any time in iPhone Settings → Smart Contacts → Contacts. We upload contacts that have a name and a phone number: name, first phone number, company and job title, birthday. Emails and postal addresses from your address book are not uploaded.

**This is other people's data.** When you upload contacts, you give us data about people who did not consent to us directly. Therefore:

- You confirm that you obtained this data lawfully and may keep it in your address book.
- Do not put unnecessary details about other people in notes, especially about health, religion, political views, sex life or ethnicity.
- If a person asks you to delete their data, delete it or write to us.

**What we do:**

- Only you can see your book. Access is restricted at database level (Row Level Security): other users and outsiders cannot read your contacts.
- We do not sell contacts, do not build a shared database from them, do not show them to other users and do not use them for advertising.
- We **never message or call** people in your book ourselves. SMS invitations are sent by you, through the iPhone Messages window, from your number and only to people you choose, no more than 50 at a time, with no "select all" button.
- For AI features we send part of the contact data to Anthropic (see section 6), without phone numbers and emails.
- If a person from your book contacts us, we will help them: explain how the service works and, on a justified request, restrict or delete their data.

Changes in your phone's address book are not copied to Smart Contacts automatically, and vice versa: the app never writes to your iPhone contacts.

## 6. AI features

For AI we use the Claude API by **Anthropic PBC** (USA). Requests are sent only from our server; the API key is not built into the app.

**What is sent:**

| Feature | What the AI receives | What it does not receive |
|---|---|---|
| Sorting contacts into sections | Your name, role and brand names; for contacts: names, roles and companies, your notes; section names | Phone numbers, emails, birthdays |
| AI assistant "who to call" | Your name, the text of your request and recent messages in this task; for each contact: name, role and company, section, your note; for contacts who have a Smart Contacts profile, their public brands, How I can help and Looking for | Phone numbers, emails, birthdays |
| "Worth writing today" | Your name and role; up to 3 contacts a day: name, role, a reason (for example "met 5 days ago", "looking for an accountant" or the first 80 characters of your note) | Phone numbers, emails, birthdays |

**Consent.** Before data is sent to AI for the first time, the app shows what will be sent and where, and asks for your explicit consent. Without consent AI features do not work; the rest of the app does. You can withdraw consent in the app settings or by writing to us.

**What Anthropic does with the data.** According to Anthropic's published rules for the commercial API, Anthropic:

- does not train models on customer data ([Commercial Terms, section B](https://www.anthropic.com/legal/commercial-terms));
- automatically deletes requests and responses within 30 days ([Privacy Center](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data), [API documentation](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention));
- may keep them longer (up to 2 years) if a request is flagged by its safety systems as violating its usage policy, or where the law requires;
- processes data under its Data Processing Addendum.

**AI answers can be wrong.** The AI suggests, you decide. Nothing is sent to people on your behalf automatically: you send ready-made messages yourself.

**Limits.** Each AI call is recorded in a counter (feature and time) to apply plan limits.

## 7. Why we use data

- To create and run your account and let you sign in.
- To show your profile to people you share your link or QR with, and to generate the vCard and Apple Wallet card.
- To store your contact book and sort contacts into sections.
- To run the AI assistant, "Worth writing today" suggestions and birthday reminders.
- To apply your plan, the promo, invite bonuses and AI limits.
- To find and fix errors (crash reports) and protect the service from abuse.
- To answer your emails and comply with the law.

We do not use data for advertising, do not sell it and do not share it for third-party marketing. We make no automated decisions about you that have legal effects.

## 8. Legal grounds

We process data on the following grounds of the Armenian Law "On Protection of Personal Data":

- **Your consent** (Articles 8 and 9). You give it at sign-up when you accept this policy, and separately for access to contacts, camera and photos and for AI features. You can withdraw consent (Article 9, part 3).
- **Our agreement with you** (Article 9, part 4, point 2), the Terms of Use: without account and profile data the service cannot work.
- **Publicly available data** (Article 8, part 1, point 2; Article 11): what you yourself made public in your profile.
- **Legal obligations**, where the law requires us to keep or disclose data.

Third parties' contact data reaches us on your initiative: you keep it in your own book, and we process it on your behalf and only to run your features.

## 9. Who we share data with

We share data only with services the app cannot work without. Each processes data under its own data protection agreements and, as we require, protects it at least as well as described in this policy.

| Service | Purpose | Data | Location |
|---|---|---|---|
| Supabase Inc. | Database, sign-in, photo storage, server functions | All account, profile, contact book and AI data | EU, France (Paris, AWS eu-west-3) |
| Anthropic PBC | AI features | See section 6 | USA |
| Vercel Inc. | Website, public profile pages, vCard, Apple Wallet card | Public profile data; technical logs | USA and other countries in Vercel's network |
| Apple | Sign in with Apple, Apple Wallet, App Store and TestFlight, future subscriptions | Apple identifier, email; Wallet card data; purchase data is processed by Apple | USA and other countries |
| Expo (650 Industries, Inc.) | Building the app and delivering updates | No personal user data is shared; when an update is downloaded, Expo's server sees technical request data (IP address, app version, platform) | USA |

We disclose data to anyone else only where the law of the Republic of Armenia requires it (for example, a court decision or a request from the authorised body), or to protect people's rights and safety. If the service is transferred to a new owner, we will tell you in advance, and the new owner will be bound by this policy.

## 10. Where data is stored and transfers abroad

The main database is in the European Union (France). AI processing, the website and some technical services run in the USA. Your data is therefore transferred outside Armenia.

Armenian law allows transfers to other countries with the data subject's consent or where the transfer follows from, and is necessary for, the purposes of processing (Article 27). By accepting this policy you consent to such transfers. The service cannot work without them: we have no servers of our own in Armenia.

## 11. How long we keep data

- **Account, profile, contact book, notes, AI conversations, daily suggestions, invites**: while the account exists. Deleted immediately when you delete the account (see section 12).
- **Crash reports**: as long as needed to fix the error, but no longer than 12 months; deleted together with the account.
- **Hosting technical logs**: a short period set by the provider (usually up to a few days).
- **Supabase database backups**: deleted data disappears from them as backups are refreshed, no later than 7 days.
- **At Anthropic**: up to 30 days (for exceptions see section 6).
- **Public page cache**: after you change or delete your profile, the old page may still be shown for up to 6 minutes.

## 12. Deleting your account and data

**In the app:** Profile → Delete account (at the bottom) → Delete forever. If you signed in with Apple, your iPhone will ask you to confirm with Face ID.

What happens immediately:

- your account, profile, brands, memberships, awards, Looking for, endorsements, the whole contact book with notes and sections, meetings, AI tasks and conversations, AI counters, daily suggestions, invites and bonuses are deleted;
- all your files (profile photo) are deleted;
- Sign in with Apple access is revoked;
- your crash reports are deleted.

Deletion is irreversible; data cannot be restored. Your public page may still open from cache for up to 6 minutes, then shows "Profile not found". If someone else has you in their contact book, their entry about you stays with them, but the link to your profile disappears.

**Without the app:** write to [hooovo.g@gmail.com](mailto:hooovo.g@gmail.com) from the address linked to your account and we will delete it manually. You can also ask us to delete specific data, for example all uploaded contacts or your AI conversations.

## 13. Your rights

Under the Armenian Law "On Protection of Personal Data" you can:

- **find out** what data about you we process, why, where it came from and who receives it, and get a copy free of charge (Articles 15 and 20);
- **correct** incomplete, inaccurate or outdated data; you can edit most data yourself in the app (Article 15, part 2);
- **ask us to block or destroy** data that is inaccurate, unlawfully obtained or no longer needed (Articles 15 and 21);
- **withdraw consent** (Article 9, part 3): delete your account, turn off access to contacts, camera and photos in iPhone Settings, turn off AI features. Withdrawal does not make earlier processing unlawful;
- **complain** about our actions to the authorised body for the protection of personal data of the Republic of Armenia or to a court (Article 17).

How: write to [hooovo.g@gmail.com](mailto:hooovo.g@gmail.com). We may ask you to confirm that the account is yours. We answer access requests within 5 days and correct or delete data within 3 working days (Article 20).

If you are in someone else's contact book and want your data removed, it is best to ask the owner of that book. You can also write to us: we will use the data you send us (for example, a phone number) only to find and fulfil your request, and will not tell book owners who asked.

## 14. iPhone permissions

| Permission | Why | Can I use the app without it |
|---|---|---|
| Contacts | Upload contacts into your book | Yes, contacts can be added by QR or manually |
| Camera | Scan QR business cards, take a profile photo | Yes |
| Photos | Choose a profile photo | Yes |
| Sign in with Apple | Sign in without a password | Yes, email sign-in is available |

You can change permissions at any time: iPhone Settings → Smart Contacts. Paid features do not depend on whether you grant access to this data.

## 15. Security

- Connections are encrypted (HTTPS/TLS); data is stored at Supabase in encrypted form.
- Access to every table is restricted by database rules: you see only your own private data.
- Secret keys are kept only on the server. The AI key is not built into the app.
- Our technical logs do not contain contacts' names, phone numbers or notes.
- Only the operator has administrative access to the database.

No protection is absolute. If a data breach happens, we will publish a notice, inform affected users and notify the police and the authorised body for the protection of personal data, as the law requires (Article 21, part 4).

## 16. Age

Smart Contacts is for people aged **18 and over**. We do not knowingly collect data from children. If you learn that a minor has created an account, write to us and we will delete it.

## 17. Changes to this policy

If we change this policy, the new version will appear at [smart-contacts.vercel.app/privacy](https://smart-contacts.vercel.app/privacy) with a new date. We will announce material changes (new types of data, new recipients, new purposes) in the app in advance and, where required, ask for your consent again.

## 18. Version and date

Version 1.0 · Effective date: 18 November 2026 · Controller: Hovhannes Ghazaryan, Yerevan, Armenia · [hooovo.g@gmail.com](mailto:hooovo.g@gmail.com)
