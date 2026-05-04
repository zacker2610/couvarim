import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendHouseholdInvitation(email: string, householdName: string, inviterName: string, inviteId: string) {
  try {
    const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${inviteId}`;
    
    const { data, error } = await resend.emails.send({
      from: 'ČoUvarím.sk <onboarding@resend.dev>', // In production, this would be your domain
      to: [email],
      subject: `Pozvánka do domácnosti "${householdName}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="background-color: #4d6047; color: white; width: 60px; height: 60px; line-height: 60px; border-radius: 15px; display: inline-block; font-size: 30px;">👩‍🍳</div>
            <h1 style="color: #333; margin-top: 10px;">ČoUvarím.sk</h1>
          </div>
          
          <p style="font-size: 16px; color: #555;">Ahoj!</p>
          
          <p style="font-size: 16px; color: #555;">
            <strong>${inviterName}</strong> ťa pozýva do svojej spoločnej domácnosti <strong>"${householdName}"</strong> v aplikácii ČoUvarím.sk.
          </p>
          
          <p style="font-size: 16px; color: #555;">
            Vďaka tomu si budete môcť spoločne plánovať varenie, zdieľať recepty a systém bude automaticky zohľadňovať chute a obmedzenia všetkých členov.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #4d6047; color: white; padding: 15px 25px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
              Prijať pozvánku
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Tento email bol odoslaný na základe požiadavky člena domácnosti ${householdName}.<br/>
            Ak pozvánku neprijmeš, nič sa nedeje.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Mail Error:', error);
    return { success: false, error };
  }
}
