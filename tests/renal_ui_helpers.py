def choose(group, value):
    """以真實 click 操作指定方案／情境標籤。"""
    group.locator(f'button[value="{value}"]').click()
