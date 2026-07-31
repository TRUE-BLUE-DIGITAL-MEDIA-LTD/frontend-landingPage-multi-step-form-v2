import axios from "axios";

export async function CreateEmailService({
  email,
  landingPageId,
}: {
  email: string;
  landingPageId: string;
}) {
  try {
    const res = await axios.post(
      "api/v1/customers",
      {
        email,
        landingPageId,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (err) {
    console.log(err);
    throw err.response.data;
  }
}

export async function ValidateEmail({
  email,
}: {
  email: string;
}): Promise<boolean> {
  try {
    const res = await axios.post(
      "api/v1/customers/validate",
      {
        email,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (err) {
    throw err.response?.data;
  }
}
