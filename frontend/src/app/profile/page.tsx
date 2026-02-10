import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ProfilePage from '@/components/ProfilePage';

export default async function ProfileRoute() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return <ProfilePage />;
}
