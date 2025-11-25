-- Create superadmin user with known credentials
-- This creates a user with email superadmin@gmail.com and password superadmin123

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'superadmin@gmail.com';
  
  IF new_user_id IS NULL THEN
    -- Create new user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'superadmin@gmail.com',
      crypt('superadmin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin"}',
      now(),
      now(),
      '',
      '',
      '',
      '',
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO new_user_id;
    
    -- Create profile for the user
    INSERT INTO public.profiles (id, full_name, email, school_level)
    VALUES (new_user_id, 'Super Admin', 'superadmin@gmail.com', NULL)
    ON CONFLICT (id) DO NOTHING;
    
    -- Assign superadmin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Superadmin user created successfully with ID: %', new_user_id;
  ELSE
    -- User exists, update password and ensure superadmin role
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('superadmin123', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now()
    WHERE id = new_user_id;
    
    -- Ensure profile exists
    INSERT INTO public.profiles (id, full_name, email, school_level)
    VALUES (new_user_id, 'Super Admin', 'superadmin@gmail.com', NULL)
    ON CONFLICT (id) DO UPDATE SET full_name = 'Super Admin', email = 'superadmin@gmail.com';
    
    -- Ensure superadmin role exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Superadmin user updated with ID: %', new_user_id;
  END IF;
END $$;