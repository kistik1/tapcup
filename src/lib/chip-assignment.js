import { base44 } from "@/api/base44Client";
import {
  buildCanonicalChipUrl,
  generatePersonalId,
  setSavedPersonalId,
} from "@/lib/personal-id";

function nowIso() {
  return new Date().toISOString();
}

async function createAuditLog(data) {
  if (!base44.entities.AdminAuditLog) return;
  await base44.entities.AdminAuditLog.create({
    ...data,
    created_at: nowIso(),
  });
}

async function deactivateChipRecords(personalId, actorRole, reason) {
  if (!base44.entities.NfcChip) return;
  const records = await base44.entities.NfcChip.filter({ personal_id: personalId });
  await Promise.all(
    records
      .filter((record) => record.status !== "inactive")
      .map((record) =>
        base44.entities.NfcChip.update(record.id, {
          status: "inactive",
          deactivated_at: nowIso(),
          notes: [record.notes, reason].filter(Boolean).join(" | "),
        })
      )
  );

  await createAuditLog({
    actor_role: actorRole,
    action: "deactivate_chip_records",
    entity_type: "NfcChip",
    entity_id: personalId,
    details: { personal_id: personalId, reason },
  });
}

export async function assignChipToProfile({
  profile,
  personalId,
  actorRole,
  actorLabel,
  notes = "",
  confirmedReassignment = false,
}) {
  const cleanPersonalId = `${personalId || ""}`.trim();
  if (!profile?.id) throw new Error("Select a customer profile first.");
  if (!cleanPersonalId) throw new Error("Personal ID is required.");

  const existingProfiles = await base44.entities.CoffeeProfile.filter({ nfc_id: cleanPersonalId });
  const existingProfile = existingProfiles.find((item) => item.id !== profile.id);

  if (existingProfile && !confirmedReassignment) {
    const error = new Error(`This chip is assigned to ${existingProfile.display_name}.`);
    error.code = "chip_conflict";
    error.profile = existingProfile;
    throw error;
  }

  if (existingProfile) {
    const replacementId = generatePersonalId("NFC-REPLACED");
    await base44.entities.CoffeeProfile.update(existingProfile.id, { nfc_id: replacementId });
    await deactivateChipRecords(cleanPersonalId, actorRole, `Reassigned from ${existingProfile.id} to ${profile.id}`);
    await createAuditLog({
      actor_role: actorRole,
      action: "replace_profile_chip",
      entity_type: "CoffeeProfile",
      entity_id: existingProfile.id,
      details: {
        old_personal_id: cleanPersonalId,
        replacement_personal_id: replacementId,
        reassigned_to_profile_id: profile.id,
      },
    });
  }

  await base44.entities.CoffeeProfile.update(profile.id, { nfc_id: cleanPersonalId });

  const canonicalUrl = buildCanonicalChipUrl(cleanPersonalId);
  let chipRecord = null;

  if (base44.entities.NfcChip) {
    await deactivateChipRecords(cleanPersonalId, actorRole, `Assigned to ${profile.id}`);
    chipRecord = await base44.entities.NfcChip.create({
      personal_id: cleanPersonalId,
      canonical_url: canonicalUrl,
      profile_id: profile.id,
      status: "active",
      assigned_by_role: actorRole,
      assigned_by_label: actorLabel,
      assigned_at: nowIso(),
      notes,
    });
  }

  await createAuditLog({
    actor_role: actorRole,
    action: existingProfile ? "reassign_chip" : "assign_chip",
    entity_type: "CoffeeProfile",
    entity_id: profile.id,
    details: {
      personal_id: cleanPersonalId,
      canonical_url: canonicalUrl,
      previous_profile_id: existingProfile?.id || null,
      chip_record_id: chipRecord?.id || null,
    },
  });

  setSavedPersonalId(cleanPersonalId);

  return {
    profile: { ...profile, nfc_id: cleanPersonalId },
    chip: chipRecord,
    canonicalUrl,
  };
}
