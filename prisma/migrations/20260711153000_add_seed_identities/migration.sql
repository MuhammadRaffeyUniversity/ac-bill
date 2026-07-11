-- Preserve existing business records by stopping before uniqueness is enforced
-- if the current data cannot satisfy the new identities.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Team"
    GROUP BY "name"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add unique Team.name constraint: duplicate team names exist. Resolve duplicates manually before rerunning this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "TeamMember"
    GROUP BY "teamId", "name"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add unique TeamMember(teamId, name) constraint: duplicate same-team member names exist. Resolve duplicates manually before rerunning this migration.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "CommissionRule"
    WHERE "teamId" IS NULL
      AND "effectiveTo" IS NULL
      AND "compensationType" IN ('SALARY', 'COMMISSION')
    GROUP BY "compensationType"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add global CommissionRule seed keys: multiple active global SALARY or COMMISSION rules exist. Resolve duplicates manually before rerunning this migration.';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "CommissionRule" ADD COLUMN "seedKey" TEXT;

-- Preserve the one current global rule of each seeded compensation type so
-- later seed upserts update it rather than inserting a second current rule.
UPDATE "CommissionRule"
SET "seedKey" = CASE "compensationType"
  WHEN 'SALARY' THEN 'initial-global-salary'
  WHEN 'COMMISSION' THEN 'initial-global-commission'
END
WHERE "teamId" IS NULL
  AND "effectiveTo" IS NULL
  AND "compensationType" IN ('SALARY', 'COMMISSION');

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_name_key" ON "TeamMember"("teamId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionRule_seedKey_key" ON "CommissionRule"("seedKey");
