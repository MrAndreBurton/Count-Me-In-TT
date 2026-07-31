const defaultAdminParents = [
   {
     id: "parent-1",
     firstName: "Keisha",
     lastName: "Joseph",
     name: "Keisha Joseph",
     initials: "KJ",
     email: "keisha.joseph@email.com",
     phone: "868-555-1011",
     relationship: "Mother",
     status: "Active",
     communicationPreference: "WhatsApp",
     receiveProgressUpdates: true,
     receiveMembershipReminders: true,
     receivePlatformAnnouncements: true,
     joined: "July 20, 2026",
     lastActive: "Today",
     studentIds: ["student-1", "student-4"],
     notes:
       "Prefers WhatsApp communication and evening contact.",
   },
   {
     id: "parent-2",
     firstName: "Marcus",
     lastName: "Pierre",
     name: "Marcus Pierre",
     initials: "MP",
     email: "marcus.pierre@email.com",
     phone: "868-555-2022",
     relationship: "Father",
     status: "Active",
     communicationPreference: "Email",
     receiveProgressUpdates: true,
     receiveMembershipReminders: true,
     receivePlatformAnnouncements: false,
     joined: "July 18, 2026",
     lastActive: "Yesterday",
     studentIds: ["student-2"],
     notes: "Interested in annual membership options.",
   },
   {
     id: "parent-3",
     firstName: "Alana",
     lastName: "Richards",
     name: "Alana Richards",
     initials: "AR",
     email: "alana.richards@email.com",
     phone: "868-555-3033",
     relationship: "Mother",
     status: "Active",
     communicationPreference: "WhatsApp",
     receiveProgressUpdates: true,
     receiveMembershipReminders: true,
     receivePlatformAnnouncements: true,
     joined: "July 10, 2026",
     lastActive: "2 days ago",
     studentIds: ["student-3"],
     notes: "Requested additional algebra practice.",
   },
   {
     id: "parent-4",
     firstName: "David",
     lastName: "Mohammed",
     name: "David Mohammed",
     initials: "DM",
     email: "david.mohammed@email.com",
     phone: "868-555-4044",
     relationship: "Guardian",
     status: "Pending",
     communicationPreference: "Phone",
     receiveProgressUpdates: true,
     receiveMembershipReminders: true,
     receivePlatformAnnouncements: false,
     joined: "July 8, 2026",
     lastActive: "Not active yet",
     studentIds: ["student-5"],
     notes: "Account setup still needs to be completed.",
   },
   {
     id: "parent-5",
     firstName: "Natasha",
     lastName: "Lewis",
     name: "Natasha Lewis",
     initials: "NL",
     email: "natasha.lewis@email.com",
     phone: "868-555-5055",
     relationship: "Mother",
     status: "Inactive",
     communicationPreference: "Email",
     receiveProgressUpdates: false,
     receiveMembershipReminders: true,
     receivePlatformAnnouncements: false,
     joined: "June 30, 2026",
     lastActive: "3 weeks ago",
     studentIds: ["student-6"],
     notes: "Follow up before the start of the new term.",
   },
 ];
const STORAGE_KEY = "countmeintt-admin-parents";
function readStoredParents() {
   try {
     const storedParents = localStorage.getItem(STORAGE_KEY);
    return storedParents
       ? JSON.parse(storedParents)
       : [];
   } catch (error) {
     console.error(
       "Unable to read stored parents:",
       error,
     );
    return [];
   }
 }
function saveStoredParents(parents) {
   try {
     localStorage.setItem(
       STORAGE_KEY,
       JSON.stringify(parents),
     );
   } catch (error) {
     console.error(
       "Unable to save parent data:",
       error,
     );
   }
 }
export function getAdminParents() {
  const storedParents = readStoredParents();

  const mergedParents = [...defaultAdminParents];

  storedParents.forEach((storedParent) => {
    const index = mergedParents.findIndex(
      (parent) => parent.id === storedParent.id,
    );

    if (index >= 0) {
      mergedParents[index] = storedParent;
    } else {
      mergedParents.push(storedParent);
    }
  });

  return mergedParents;
}

export function getAdminParentById(parentId) {
   return getAdminParents().find(
     (parent) => parent.id === parentId,
   );
 }
export function createAdminParent(parentData) {
   const storedParents = readStoredParents();
  const firstName = parentData.firstName.trim();
   const lastName = parentData.lastName.trim();
  const newParent = {
     id: `parent-${Date.now()}`,
     firstName,
     lastName,
     name: `${firstName} ${lastName}`,
     initials: `${firstName.charAt(0)}${lastName.charAt(
       0,
     )}`.toUpperCase(),
     email: parentData.email.trim().toLowerCase(),
     phone: parentData.phone.trim(),
     relationship: parentData.relationship,
     status: parentData.status,
     communicationPreference:
       parentData.communicationPreference,
     receiveProgressUpdates:
       parentData.receiveProgressUpdates,
     receiveMembershipReminders:
       parentData.receiveMembershipReminders,
     receivePlatformAnnouncements:
       parentData.receivePlatformAnnouncements,
     joined: new Date().toLocaleDateString(
       "en-US",
       {
         year: "numeric",
         month: "long",
         day: "numeric",
       },
     ),
     lastActive:
       parentData.status === "Active"
         ? "Not active yet"
         : "Account setup incomplete",
     studentIds: [],
     notes:
       parentData.notes.trim() ||
       "No admin notes added.",
   };
  saveStoredParents([
     ...storedParents,
     newParent,
   ]);
  return newParent;
 }

export function updateAdminParent(parentId, updates) {
  const storedParents = readStoredParents();

  const existingParent = getAdminParentById(parentId);

  if (!existingParent) {
    return null;
  }

  const firstName = updates.firstName.trim();
  const lastName = updates.lastName.trim();

  const updatedParent = {
    ...existingParent,
    ...updates,
    id: parentId,
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    initials: `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
    email: updates.email.trim().toLowerCase(),
    phone: updates.phone.trim(),
    notes:
      updates.notes.trim() ||
      "No admin notes added.",
  };

  const updatedParents = storedParents.some(
    (parent) => parent.id === parentId,
  )
    ? storedParents.map((parent) =>
        parent.id === parentId
          ? updatedParent
          : parent,
      )
    : [...storedParents, updatedParent];

  saveStoredParents(updatedParents);

  return updatedParent;
}



