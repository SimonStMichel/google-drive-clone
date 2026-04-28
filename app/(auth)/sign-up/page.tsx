import { createSupabaseServerClient } from "@/lib/supabase/server-client";

import AuthForm from "@/components/AuthForm";

const SignUp = async () => {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <AuthForm type="sign-up" user={user} />
    );
};

export default SignUp;