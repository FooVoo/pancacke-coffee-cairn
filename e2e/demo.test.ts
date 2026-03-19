import { expect, test } from '@playwright/test';

test('guest users can browse the seeded local-first character flow', async ({ page }) => {
	await page.goto('/characters');

	await expect(page.getByRole('heading', { level: 1, name: 'Your Characters' })).toBeVisible();
	await expect(page.getByText('Guest Mode (data stored locally)')).toBeVisible();

	const demoCharacterCard = page.getByRole('link', { name: /Edrin Thorn/i });
	await expect(demoCharacterCard).toBeVisible();
	await demoCharacterCard.click();

	await expect(page).toHaveURL(/\/characters\/local_char_/);
	await expect(page.getByRole('heading', { level: 1, name: 'Edrin Thorn' })).toBeVisible();
	await expect(page.getByText('Guest Mode (data stored locally)')).toBeVisible();
	await expect(page.getByRole('heading', { level: 2, name: 'Skills' })).toBeVisible();
	await expect(page.getByText('Healing Word')).toBeVisible();
});

test('guest users see a friendly missing-character state for unknown local ids', async ({ page }) => {
	await page.goto('/characters/local_char_missing');

	await expect(page.getByRole('heading', { level: 1, name: 'Character not found' })).toBeVisible();
	await expect(page.getByText('This guest character was not found in local storage.')).toBeVisible();
});

test('users can register, logout, and log back in', async ({ page }) => {
	const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
	const username = `pw-user-${uniqueSuffix}`;
	const email = `${username}@example.com`;
	const password = 'test-pass';

	await page.goto('/register');
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Register' }).click();

	await expect(page).toHaveURL('/characters');
	await expect(page.getByText(`Welcome, ${username}`)).toBeVisible();
	await expect(page.getByText("You don't have any characters yet.")).toBeVisible();

	await page.getByRole('button', { name: 'Logout' }).click();
	await expect(page).toHaveURL('/login');
	await expect(page.getByRole('heading', { level: 1, name: 'Login to Cairn' })).toBeVisible();

	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Login' }).click();

	await expect(page).toHaveURL('/characters');
	await expect(page.getByText(`Welcome, ${username}`)).toBeVisible();
});

test('invalid login attempts show an inline error', async ({ page }) => {
	await page.goto('/login');

	await page.getByLabel('Username').fill('missing-user');
	await page.getByLabel('Password').fill('wrong-pass');
	await page.getByRole('button', { name: 'Login' }).click();

	await expect(page).toHaveURL('/login');
	await expect(page.getByText('Invalid username or password')).toBeVisible();
});
