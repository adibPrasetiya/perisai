-- DropIndex
DROP INDEX `activity_logs_actionType_idx` ON `activity_logs`;

-- DropIndex
DROP INDEX `activity_logs_level_idx` ON `activity_logs`;

-- DropIndex
DROP INDEX `assets_status_idx` ON `assets`;

-- DropIndex
DROP INDEX `business_processes_status_idx` ON `business_processes`;

-- DropIndex
DROP INDEX `frameworks_code_idx` ON `frameworks`;

-- DropIndex
DROP INDEX `frameworks_isActive_idx` ON `frameworks`;

-- DropIndex
DROP INDEX `profiles_isVerified_idx` ON `profiles`;

-- DropIndex
DROP INDEX `program_frameworks_status_idx` ON `program_frameworks`;

-- DropIndex
DROP INDEX `risk_contexts_contextType_idx` ON `risk_contexts`;

-- DropIndex
DROP INDEX `risk_contexts_status_idx` ON `risk_contexts`;

-- DropIndex
DROP INDEX `risk_programs_status_idx` ON `risk_programs`;

-- DropIndex
DROP INDEX `risk_treatment_plans_status_idx` ON `risk_treatment_plans`;

-- DropIndex
DROP INDEX `sessions_refreshToken_idx` ON `sessions`;

-- DropIndex
DROP INDEX `unit_kerja_code_idx` ON `unit_kerja`;

-- DropIndex
DROP INDEX `users_email_idx` ON `users`;

-- DropIndex
DROP INDEX `users_isActive_isVerified_idx` ON `users`;

-- DropIndex
DROP INDEX `users_username_idx` ON `users`;

-- DropIndex
DROP INDEX `working_papers_status_idx` ON `working_papers`;
