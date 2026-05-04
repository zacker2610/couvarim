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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
          <div style="margin-bottom: 40px; display: flex; align-items: center; justify-content: center;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="vertical-align: middle;">
                  <div style="background-color: #93a381; width: 50px; height: 50px; border-radius: 16px; display: flex; align-items: center; justify-content: center; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <img src="https://img.icons8.com/ios-filled/50/ffffff/chef-hat.png" width="28" height="28" style="display: block; margin: 11px auto;" alt="👨‍🍳" />
                  </div>
                </td>
                <td style="vertical-align: middle; padding-left: 12px;">
                  <h1 style="color: #4d6047; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">ČoUvarím.sk</h1>
                </td>
              </tr>
            </table>
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
