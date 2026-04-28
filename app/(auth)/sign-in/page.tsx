import { createSupabaseServerClient } from "@/lib/supabase/server-client";

import AuthForm from "@/components/AuthForm";

const SignIn = async () => {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <AuthForm type="sign-in" user={user} />
    );
};

export default SignIn;