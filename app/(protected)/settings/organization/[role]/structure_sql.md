| table_name          | column_name            | data_type                |
| ------------------- | ---------------------- | ------------------------ |
| ab_tests_audit      | id                     | uuid                     |
| ab_tests_audit      | test_id                | uuid                     |
| ab_tests_audit      | modified_by            | uuid                     |
| ab_tests_audit      | modified_at            | timestamp with time zone |
| ab_tests_audit      | changes                | jsonb                    |
| ab_tests_summary    | id                     | uuid                     |
| ab_tests_summary    | organization_id        | uuid                     |
| ab_tests_summary    | name                   | text                     |
| ab_tests_summary    | type                   | USER-DEFINED             |
| ab_tests_summary    | status                 | USER-DEFINED             |
| ab_tests_summary    | hypothesis             | text                     |
| ab_tests_summary    | context                | text                     |
| ab_tests_summary    | roadmap                | jsonb                    |
| ab_tests_summary    | expected_results       | jsonb                    |
| ab_tests_summary    | variations             | jsonb                    |
| ab_tests_summary    | owner_id               | uuid                     |
| ab_tests_summary    | created_by             | uuid                     |
| ab_tests_summary    | last_modified_by       | uuid                     |
| ab_tests_summary    | created_at             | timestamp with time zone |
| ab_tests_summary    | updated_at             | timestamp with time zone |
| notifications       | id                     | uuid                     |
| notifications       | user_id                | uuid                     |
| notifications       | type                   | text                     |
| notifications       | title                  | text                     |
| notifications       | message                | text                     |
| notifications       | read                   | boolean                  |
| notifications       | created_at             | timestamp with time zone |
| organization_limits | organization_id        | uuid                     |
| organization_limits | super_admin_limit      | integer                  |
| organization_limits | admin_limit            | integer                  |
| organization_limits | user_limit             | integer                  |
| organization_limits | viewer_limit           | integer                  |
| organization_limits | created_at             | timestamp with time zone |
| organization_users  | id                     | uuid                     |
| organization_users  | organization_id        | uuid                     |
| organization_users  | user_id                | uuid                     |
| organization_users  | role_id                | uuid                     |
| organization_users  | status                 | text                     |
| organization_users  | created_at             | timestamp with time zone |
| organizations       | id                     | uuid                     |
| organizations       | name                   | text                     |
| organizations       | type                   | text                     |
| organizations       | created_at             | timestamp with time zone |
| organizations       | parent_organization_id | uuid                     |
| organizations       | subscription_tier      | text                     |
| profiles            | id                     | uuid                     |
| profiles            | name                   | text                     |
| profiles            | email                  | text                     |
| profiles            | created_at             | timestamp with time zone |
| profiles            | two_factor_enabled     | boolean                  |
| profiles            | last_login             | timestamp with time zone |
| roles               | id                     | uuid                     |
| roles               | name                   | text                     |
| roles               | type                   | text                     |
| roles               | permissions            | jsonb                    |
| roles               | created_at             | timestamp with time zone |
| test_versions       | id                     | uuid                     |
| test_versions       | test_id                | uuid                     |
| test_versions       | version_number         | integer                  |
| test_versions       | hypothesis             | text                     |
| test_versions       | context                | text                     |
| test_versions       | type                   | USER-DEFINED             |
| test_versions       | status                 | USER-DEFINED             |
| test_versions       | roadmap                | jsonb                    |
| test_versions       | expected_results       | jsonb                    |
| test_versions       | variations             | jsonb                    |
| test_versions       | created_by             | uuid                     |
| test_versions       | created_at             | timestamp with time zone |